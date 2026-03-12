"""
Monitoring Agent for Pharmaceutical Supply Chain Agentic AI

Monitors inventory levels and generates alerts for stockouts, overstock,
demand anomalies, and other supply chain issues.
"""

import logging
import os
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI not available. Will use rule-based insights.")

try:
    from utils.database import get_database
    DB_AVAILABLE = True
except Exception:
    DB_AVAILABLE = False

# ── Synthetic inventory data used as fallback when DB is empty / unavailable ──
SYNTHETIC_INVENTORY = [
    {"branch_id": "MAIN_BRANCH",  "drug_id": "Metformin",    "current_stock": 45,   "optimal_stock": 500,  "safe_stock": 150, "demand_forecast": 300},
    {"branch_id": "NORTH_BRANCH", "drug_id": "Insulin",      "current_stock": 120,  "optimal_stock": 400,  "safe_stock": 200, "demand_forecast": 600},
    {"branch_id": "SOUTH_BRANCH", "drug_id": "Amoxicillin",  "current_stock": 850,  "optimal_stock": 500,  "safe_stock": 200, "demand_forecast": 450},
    {"branch_id": "EAST_BRANCH",  "drug_id": "Paracetamol",  "current_stock": 30,   "optimal_stock": 600,  "safe_stock": 180, "demand_forecast": 900},
    {"branch_id": "WEST_BRANCH",  "drug_id": "Omeprazole",   "current_stock": 200,  "optimal_stock": 350,  "safe_stock": 120, "demand_forecast": 420},
    {"branch_id": "MAIN_BRANCH",  "drug_id": "Atorvastatin", "current_stock": 1200, "optimal_stock": 600,  "safe_stock": 250, "demand_forecast": 480},
    {"branch_id": "NORTH_BRANCH", "drug_id": "Lisinopril",   "current_stock": 15,   "optimal_stock": 300,  "safe_stock": 100, "demand_forecast": 360},
    {"branch_id": "SOUTH_BRANCH", "drug_id": "Amlodipine",   "current_stock": 380,  "optimal_stock": 400,  "safe_stock": 150, "demand_forecast": 540},
]


class MonitoringAgent:
    """Agent for monitoring pharmaceutical inventory and generating alerts"""

    def __init__(self):
        self.client = None
        self.llm_model = "gpt-4o-mini"

        if OPENAI_AVAILABLE:
            api_key = self._load_api_key()
            if api_key:
                try:
                    self.client = OpenAI(api_key=api_key)
                    logger.info("OpenAI client initialized for monitoring")
                except Exception as e:
                    logger.warning(f"Failed to initialize OpenAI client: {e}")
                    self.client = None

        # Alert thresholds
        self.thresholds = {
            "critical_stockout_days": 2,
            "warning_stockout_days": 7,
            "overstock_multiplier": 1.5,
            "understock_multiplier": 0.3,
            "demand_anomaly_threshold": 2.0
        }

    def _load_api_key(self) -> Optional[str]:
        """Load API key from env; ignore placeholders"""
        env_key = os.getenv("OPENAI_API_KEY")
        if env_key and env_key not in ("", "your_api_key_here"):
            return env_key

        for filename in [".env", "env.txt"]:
            try:
                with open(filename, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("OPENAI_API_KEY="):
                            candidate = line.split("=", 1)[1]
                            if candidate and candidate != "your_api_key_here":
                                return candidate
            except FileNotFoundError:
                continue
        return None

    def generate_alerts(self, severity_filter: Optional[str] = None, limit: int = 50) -> Dict[str, Any]:
        """Generate inventory alerts based on current stock levels"""
        try:
            logger.info(f"Generating alerts, severity_filter: {severity_filter}, limit: {limit}")

            inventory_data = self._get_all_inventory()
            alerts: List[Dict[str, Any]] = []

            for item in inventory_data:
                alerts.extend(self._analyze_inventory_item(item))

            if severity_filter:
                alerts = [a for a in alerts if a["severity"] == severity_filter]

            severity_order = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
            alerts.sort(key=lambda x: (severity_order.get(x["severity"], 3), x["timestamp"]))

            alerts = alerts[:limit]
            summary = self._generate_summary(alerts)

            # Generate AI insights — either via OpenAI or rule-based fallback
            if self.client and alerts:
                ai_insights = self._get_ai_alert_insights(alerts[:10])
            else:
                ai_insights = self._get_rule_based_insights(alerts, summary)

            return {
                "alerts": alerts,
                "total_alerts": len(alerts),
                "summary": summary,
                "ai_insights": ai_insights,
                "generated_at": datetime.utcnow(),
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Error generating alerts: {e}")
            return self._error_response(str(e))

    def _get_all_inventory(self) -> List[Dict[str, Any]]:
        """Get inventory from DB, fall back to synthetic data if unavailable or empty"""
        if DB_AVAILABLE:
            try:
                db = get_database()
                inventory = list(db.inventory.find({}))
                if inventory:
                    logger.info(f"Retrieved {len(inventory)} inventory records from DB")
                    return inventory
                else:
                    logger.info("DB is empty — using synthetic inventory data")
            except Exception as e:
                logger.warning(f"DB unavailable: {e} — using synthetic inventory data")

        return SYNTHETIC_INVENTORY

    def _analyze_inventory_item(self, item: Dict[str, Any]) -> List[Dict[str, Any]]:
        try:
            alerts = []

            current_stock = item.get("current_stock", 0)
            optimal_stock = item.get("optimal_stock", 0)
            safe_stock    = item.get("safe_stock", 0)
            branch_id     = item.get("branch_id", "UNKNOWN")
            drug_id       = item.get("drug_id", "UNKNOWN")

            demand_forecast = item.get("demand_forecast", 300)
            avg_daily_demand = demand_forecast / 30 if demand_forecast > 0 else 10
            days_until_stockout = current_stock / avg_daily_demand if avg_daily_demand > 0 else 999

            if days_until_stockout <= self.thresholds["critical_stockout_days"]:
                alerts.append({
                    "severity": "CRITICAL",
                    "branch_id": branch_id,
                    "item_id": drug_id,
                    "alert_type": "STOCKOUT_RISK",
                    "current_stock": current_stock,
                    "days_until_stockout": round(days_until_stockout, 1),
                    "recommended_action": "URGENT_ORDER",
                    "message": f"Critical stockout risk: {days_until_stockout:.1f} days remaining for {drug_id}",
                    "timestamp": datetime.utcnow(),
                    "is_resolved": False
                })
            elif days_until_stockout <= self.thresholds["warning_stockout_days"]:
                alerts.append({
                    "severity": "WARNING",
                    "branch_id": branch_id,
                    "item_id": drug_id,
                    "alert_type": "LOW_STOCK",
                    "current_stock": current_stock,
                    "days_until_stockout": round(days_until_stockout, 1),
                    "recommended_action": "ORDER_SOON",
                    "message": f"Low stock warning: {days_until_stockout:.1f} days remaining for {drug_id}",
                    "timestamp": datetime.utcnow(),
                    "is_resolved": False
                })

            if optimal_stock > 0 and current_stock > optimal_stock * self.thresholds["overstock_multiplier"]:
                excess_quantity = current_stock - optimal_stock
                alerts.append({
                    "severity": "WARNING",
                    "branch_id": branch_id,
                    "item_id": drug_id,
                    "alert_type": "OVERSTOCK",
                    "current_stock": current_stock,
                    "optimal_stock": optimal_stock,
                    "excess_quantity": excess_quantity,
                    "recommended_action": "REDISTRIBUTE",
                    "message": f"Overstock detected: {excess_quantity} units above optimal for {drug_id}",
                    "timestamp": datetime.utcnow(),
                    "is_resolved": False
                })

            if safe_stock > 0 and current_stock < safe_stock * self.thresholds["understock_multiplier"]:
                deficit_quantity = safe_stock - current_stock
                alerts.append({
                    "severity": "INFO",
                    "branch_id": branch_id,
                    "item_id": drug_id,
                    "alert_type": "UNDERSTOCK",
                    "current_stock": current_stock,
                    "safe_stock": safe_stock,
                    "deficit_quantity": deficit_quantity,
                    "recommended_action": "CHECK_INVENTORY",
                    "message": f"Understock notice: {deficit_quantity} units below safe level for {drug_id}",
                    "timestamp": datetime.utcnow(),
                    "is_resolved": False
                })

            return alerts
        except Exception as e:
            logger.error(f"Error analyzing inventory item {item.get('drug_id')}: {e}")
            return []

    def _generate_summary(self, alerts: List[Dict[str, Any]]) -> Dict[str, Any]:
        try:
            total    = len(alerts)
            critical = len([a for a in alerts if a["severity"] == "CRITICAL"])
            warning  = len([a for a in alerts if a["severity"] == "WARNING"])
            info     = len([a for a in alerts if a["severity"] == "INFO"])

            branch_counts: Dict[str, int] = {}
            for alert in alerts:
                branch = alert["branch_id"]
                branch_counts[branch] = branch_counts.get(branch, 0) + 1

            top_branches = sorted(branch_counts.items(), key=lambda x: x[1], reverse=True)[:5]

            return {
                "total_alerts": total,
                "critical_count": critical,
                "warning_count": warning,
                "info_count": info,
                "top_affected_branches": top_branches,
                "alert_types": list(set(a["alert_type"] for a in alerts))
            }
        except Exception as e:
            logger.error(f"Error generating alert summary: {e}")
            return {}

    def _get_rule_based_insights(self, alerts: List[Dict[str, Any]], summary: Dict[str, Any]) -> str:
        """Generate intelligent, rule-based insights without requiring an OpenAI key."""
        if not alerts:
            return (
                "All monitored branches are operating within normal parameters. "
                "No stock anomalies detected across the distribution network. "
                "Continue routine monitoring and scheduled replenishment cycles."
            )

        critical_alerts = [a for a in alerts if a["severity"] == "CRITICAL"]
        warning_alerts  = [a for a in alerts if a["severity"] == "WARNING"]
        overstock_items = [a for a in alerts if a.get("alert_type") == "OVERSTOCK"]
        stockout_items  = [a for a in critical_alerts if a.get("alert_type") == "STOCKOUT_RISK"]

        insights = []

        # Critical stockout analysis
        if stockout_items:
            drugs = list(set(a["item_id"] for a in stockout_items))
            branches = list(set(a["branch_id"] for a in stockout_items))
            avg_days = sum(a.get("days_until_stockout", 1) for a in stockout_items) / len(stockout_items)
            insights.append(
                f"⚠️ CRITICAL — {len(stockout_items)} stockout risk(s) detected for "
                f"{', '.join(drugs)} at {', '.join(branches)}. "
                f"Average remaining supply: {avg_days:.1f} days. "
                f"Immediate emergency procurement is required to avoid treatment disruption."
            )

        # Warning analysis
        if warning_alerts and len(warning_alerts) > 0:
            warn_branches = list(set(a["branch_id"] for a in warning_alerts))
            insights.append(
                f"📋 WARNING — {len(warning_alerts)} low-stock condition(s) across "
                f"{', '.join(warn_branches[:3])}. "
                f"Standard replenishment orders should be placed within 48–72 hours."
            )

        # Overstock analysis
        if overstock_items:
            overstock_drugs = list(set(a["item_id"] for a in overstock_items))
            overstock_branches = list(set(a["branch_id"] for a in overstock_items))
            insights.append(
                f"📦 REDISTRIBUTION OPPORTUNITY — {len(overstock_items)} overstock item(s) identified: "
                f"{', '.join(overstock_drugs)} at {', '.join(overstock_branches)}. "
                f"Consider internal transfers to branches with low stock to optimize working capital."
            )

        # Overall network health
        total = summary.get("total_alerts", 0)
        critical_count = summary.get("critical_count", 0)
        health_score = max(0, 100 - (critical_count * 20) - (len(warning_alerts) * 5))
        health_label = "critical" if health_score < 50 else "moderate" if health_score < 75 else "good"
        insights.append(
            f"🏥 Network Health Score: {health_score}/100 ({health_label}). "
            f"Total {total} active alerts across the distribution network. "
            f"Prioritize critical items first, then address warnings systematically."
        )

        return " | ".join(insights)

    def _get_ai_alert_insights(self, alerts: List[Dict[str, Any]]) -> str:
        if not self.client or not alerts:
            return self._get_rule_based_insights(alerts, self._generate_summary(alerts))

        try:
            alert_summary = f"Total alerts: {len(alerts)}\n"
            alert_summary += f"Critical: {len([a for a in alerts if a['severity'] == 'CRITICAL'])}\n"
            alert_summary += f"Warning: {len([a for a in alerts if a['severity'] == 'WARNING'])}\n"
            alert_summary += f"Types: {list(set(a['alert_type'] for a in alerts))[:3]}\n\nSamples:\n"

            for i, alert in enumerate(alerts[:5]):
                alert_summary += f"{i+1}. {alert['severity']} - {alert['branch_id']}: {alert['message']}\n"

            prompt = f"""You are a pharmaceutical supply chain expert analyzing inventory alerts.
{alert_summary}
Provide concise strategic insights (max 200 words):
1. Main patterns in these alerts
2. Immediate priority actions
3. Systemic issues and prevention recommendations
Be practical and actionable."""

            response = self.client.chat.completions.create(
                model=self.llm_model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=400,
                temperature=0.2
            )
            return response.choices[0].message.content

        except Exception as e:
            err_text = str(e)
            if "invalid_api_key" in err_text or "401" in err_text:
                logger.warning("OpenAI API key invalid; falling back to rule-based insights.")
                self.client = None
            else:
                logger.warning(f"LLM API call failed: {e}")
            return self._get_rule_based_insights(alerts, self._generate_summary(alerts))

    def _error_response(self, error_msg: str) -> Dict[str, Any]:
        return {
            "alerts": [],
            "total_alerts": 0,
            "summary": {},
            "ai_insights": self._get_rule_based_insights([], {}),
            "status": "error",
            "message": error_msg
        }


