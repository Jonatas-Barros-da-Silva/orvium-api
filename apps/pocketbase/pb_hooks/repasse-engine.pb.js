/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Only process PROCEDURE_EXECUTED events
  if (e.record.get("event_type") !== "PROCEDURE_EXECUTED") {
    e.next();
    return;
  }

  try {
    // Step 1: Retrieve professional record using professional_id from event
    const professionalId = e.record.get("professional_id");
    const professional = $app.findFirstRecordByData("professionals", "professional_id", professionalId);
    
    if (!professional) {
      // Create failed calculation record
      const failedCalc = new Record($app.findCollectionByNameOrId("repasse_calculations"));
      failedCalc.set("repasse_calculation_id", e.record.get("event_id") + "_calc_failed");
      failedCalc.set("organization_id", e.record.get("organization_id"));
      failedCalc.set("event_id", e.record.get("event_id"));
      failedCalc.set("professional_id", professionalId);
      failedCalc.set("repasse_rule_id", "");
      failedCalc.set("gross_amount", e.record.get("gross_amount"));
      failedCalc.set("calculated_repasse_amount", 0);
      failedCalc.set("calculation_status", "failed");
      $app.save(failedCalc);
      e.next();
      return;
    }

    // Step 2: Get professional's active repasse_rule using repasse_rule_id
    const repasseRuleId = professional.get("repasse_rule_id");
    if (!repasseRuleId) {
      // Create failed calculation record - no rule assigned
      const failedCalc = new Record($app.findCollectionByNameOrId("repasse_calculations"));
      failedCalc.set("repasse_calculation_id", e.record.get("event_id") + "_calc_failed");
      failedCalc.set("organization_id", e.record.get("organization_id"));
      failedCalc.set("event_id", e.record.get("event_id"));
      failedCalc.set("professional_id", professionalId);
      failedCalc.set("repasse_rule_id", "");
      failedCalc.set("gross_amount", e.record.get("gross_amount"));
      failedCalc.set("calculated_repasse_amount", 0);
      failedCalc.set("calculation_status", "failed");
      $app.save(failedCalc);
      e.next();
      return;
    }

    const repasseRule = $app.findFirstRecordByData("repasse_rules", "repasse_rule_id", repasseRuleId);
    if (!repasseRule) {
      // Create failed calculation record - rule not found
      const failedCalc = new Record($app.findCollectionByNameOrId("repasse_calculations"));
      failedCalc.set("repasse_calculation_id", e.record.get("event_id") + "_calc_failed");
      failedCalc.set("organization_id", e.record.get("organization_id"));
      failedCalc.set("event_id", e.record.get("event_id"));
      failedCalc.set("professional_id", professionalId);
      failedCalc.set("repasse_rule_id", repasseRuleId);
      failedCalc.set("gross_amount", e.record.get("gross_amount"));
      failedCalc.set("calculated_repasse_amount", 0);
      failedCalc.set("calculation_status", "failed");
      $app.save(failedCalc);
      e.next();
      return;
    }

    // Step 3: Calculate repasse based on rule model
    const grossAmount = e.record.get("gross_amount");
    const repasseModel = repasseRule.get("repasse_model");
    let calculatedRepasse = 0;

    if (repasseModel === "percentage") {
      const percentageValue = repasseRule.get("percentage_value") || 0;
      calculatedRepasse = (grossAmount * percentageValue) / 100;
    } else if (repasseModel === "fixed") {
      calculatedRepasse = repasseRule.get("fixed_amount") || 0;
    } else if (repasseModel === "hybrid") {
      const percentageValue = repasseRule.get("percentage_value") || 0;
      const fixedAmount = repasseRule.get("fixed_amount") || 0;
      calculatedRepasse = (grossAmount * percentageValue) / 100 + fixedAmount;
    }

    // Step 4: Create record in repasse_calculations with calculated values
    const calculation = new Record($app.findCollectionByNameOrId("repasse_calculations"));
    calculation.set("repasse_calculation_id", e.record.get("event_id") + "_calc");
    calculation.set("organization_id", e.record.get("organization_id"));
    calculation.set("event_id", e.record.get("event_id"));
    calculation.set("professional_id", professionalId);
    calculation.set("repasse_rule_id", repasseRuleId);
    calculation.set("gross_amount", grossAmount);
    calculation.set("calculated_repasse_amount", calculatedRepasse);
    calculation.set("calculation_status", "completed");
    
    $app.save(calculation);
    e.next();
  } catch (error) {
    // If any error occurs, create record with calculation_status='failed' and log error
    try {
      const failedCalc = new Record($app.findCollectionByNameOrId("repasse_calculations"));
      failedCalc.set("repasse_calculation_id", e.record.get("event_id") + "_calc_error");
      failedCalc.set("organization_id", e.record.get("organization_id"));
      failedCalc.set("event_id", e.record.get("event_id"));
      failedCalc.set("professional_id", e.record.get("professional_id"));
      failedCalc.set("repasse_rule_id", "");
      failedCalc.set("gross_amount", e.record.get("gross_amount"));
      failedCalc.set("calculated_repasse_amount", 0);
      failedCalc.set("calculation_status", "failed");
      $app.save(failedCalc);
    } catch (innerError) {
      console.error("Failed to create error calculation record: " + innerError.message);
    }
    console.error("Repasse calculation error: " + error.message);
    e.next();
  }
}, "financial_events");