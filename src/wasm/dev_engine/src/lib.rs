use serde::Deserialize;
use wasm_bindgen::prelude::*;

#[derive(Deserialize)]
struct EngineInput {
    title: String,
    summary: String,
    stack: String,
    hasRepo: bool,
    hasDemo: bool,
}

#[wasm_bindgen]
pub fn score_project(input_json: &str) -> f64 {
    let parsed = serde_json::from_str::<EngineInput>(input_json);
    if parsed.is_err() {
        return 0.0;
    }
    let input = parsed.unwrap();

    let mut score = 22.0_f64;
    score += input.title.trim().chars().count().min(20) as f64;
    score += ((input.summary.trim().chars().count() / 3).min(24)) as f64;
    score += (split_stack_count(&input.stack) * 5).min(22) as f64;
    if input.hasRepo {
        score += 6.0;
    }
    if input.hasDemo {
        score += 6.0;
    }

    score.clamp(0.0, 100.0).round()
}

fn split_stack_count(stack: &str) -> usize {
    stack
        .split(|c| c == ',' || c == '+' || c == '/' || c == '|')
        .map(|v| v.trim())
        .filter(|v| v.len() > 1)
        .count()
}
