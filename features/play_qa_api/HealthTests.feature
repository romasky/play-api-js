@allure.label.epic:System @allure.label.suite:Health_Check @allure.label.subSuite:Availability
Feature: Health Check

  @Run @Smoke @Positive @allure.label.severity:critical @allure.label.story:Positive_Scenario
  Scenario: Health endpoint returns 200 with ok status
    When Send GET health request and save as "response"
    Then Get and check status code 200 from "response"
    And Assert health response has status field in "response"
    And Assert health response has time field in "response"
    And Assert response body contains "ok" in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Health endpoint returns correct content type
    When Send GET health request and save as "response"
    Then Get and check status code 200 from "response"
    And Assert response header "content-type" contains "application/json" in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Health endpoint returns request-id header
    When Send GET health request and save as "response"
    Then Get and check status code 200 from "response"
    And Assert response header "x-request-id" is present in "response"
