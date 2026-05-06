@allure.label.epic:User_Lifecycle @allure.label.suite:User_Management @allure.label.subSuite:Options
Feature: Options

  @Run @Smoke @Positive @allure.label.severity:normal @allure.label.story:Positive_Scenario
  Scenario: OPTIONS returns 200 with allowed methods and endpoints
    When Send OPTIONS users request and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert options response has allowed_methods in "response"
    And Assert options response has endpoints in "response"
    And Assert response body contains "GET" in "response"
    And Assert response body contains "POST" in "response"
    And Assert response body contains "PUT" in "response"
    And Assert response body contains "DELETE" in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: OPTIONS response has Allow header
    When Send OPTIONS users request and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert response header "allow" is present in "response"
    And Assert Allow header contains "GET" in "response"
    And Assert Allow header contains "DELETE" in "response"
