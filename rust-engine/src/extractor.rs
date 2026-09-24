use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtractedQuestSummary {
    pub id: String,
    pub title: String,
    pub publisher: String,
    pub task_type: String,
    pub target_seconds: u32,
    pub current_seconds: u32,
    pub percent_completed: f32,
    pub claimable: bool,
    pub reward_asset: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EntitlementSummary {
    pub id: String,
    pub sku_id: Option<String>,
    pub application_id: Option<String>,
    pub promotion_id: Option<String>,
    pub code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VaultAuditReport {
    pub total_quests: usize,
    pub active_quests: Vec<ExtractedQuestSummary>,
    pub claimable_rewards: usize,
    pub entitlements_count: usize,
    pub entitlements: Vec<EntitlementSummary>,
    pub experiment_flags: HashMap<String, String>,
    pub risk_tier: String,
}

pub struct RustDiscordParser;

impl RustDiscordParser {
    pub fn parse_quests_json(raw_json: &str) -> Vec<ExtractedQuestSummary> {
        let mut summaries = Vec::new();
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(raw_json) {
            let quests_arr = if let Some(arr) = val.get("quests").and_then(|v| v.as_array()) {
                arr.clone()
            } else if let Some(arr) = val.as_array() {
                arr.clone()
            } else {
                Vec::new()
            };

            for q in quests_arr {
                let id = q.get("id").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
                let config = q.get("config");
                let title = config
                    .and_then(|c| c.get("messages"))
                    .and_then(|m| m.get("quest_name"))
                    .and_then(|t| t.as_str())
                    .unwrap_or("Discord Quest")
                    .to_string();

                let publisher = config
                    .and_then(|c| c.get("messages"))
                    .and_then(|m| m.get("game_publisher"))
                    .and_then(|p| p.as_str())
                    .unwrap_or("Discord")
                    .to_string();

                let task_type = "STREAM_OR_PLAY".to_string();
                let target_seconds = 900;
                let current_seconds = 0;
                let percent = 0.0;
                let claimable = false;

                summaries.push(ExtractedQuestSummary {
                    id,
                    title,
                    publisher,
                    task_type,
                    target_seconds,
                    current_seconds,
                    percent_completed: percent,
                    claimable,
                    reward_asset: None,
                });
            }
        }
        summaries
    }

    pub fn audit_vault(
        quests_json: &str,
        entitlements_json: &str,
    ) -> VaultAuditReport {
        let active_quests = Self::parse_quests_json(quests_json);
        let total_quests = active_quests.len();
        let claimable_rewards = active_quests.iter().filter(|q| q.claimable).count();

        let mut entitlements = Vec::new();
        if let Ok(ent_val) = serde_json::from_str::<serde_json::Value>(entitlements_json) {
            if let Some(arr) = ent_val.as_array() {
                for item in arr {
                    let id = item.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                    let sku_id = item.get("sku_id").and_then(|v| v.as_str()).map(|s| s.to_string());
                    let promotion_id = item.get("promotion_id").and_then(|v| v.as_str()).map(|s| s.to_string());
                    entitlements.push(EntitlementSummary {
                        id,
                        sku_id,
                        application_id: None,
                        promotion_id,
                        code: None,
                    });
                }
            }
        }

        VaultAuditReport {
            total_quests,
            active_quests,
            claimable_rewards,
            entitlements_count: entitlements.len(),
            entitlements,
            experiment_flags: HashMap::new(),
            risk_tier: "LOW".to_string(),
        }
    }
}
