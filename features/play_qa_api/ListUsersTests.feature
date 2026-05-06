@allure.label.epic:User_Lifecycle @allure.label.suite:User_Management @allure.label.subSuite:List_Users
Feature: List Users

  @Run @Smoke @Positive @allure.label.severity:normal @allure.label.story:Positive_Scenario
  Scenario: List users returns 200 with pagination fields
    When Send GET users list request and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert users list has "users" field in "response"
    And Assert users list has "page" field in "response"
    And Assert users list has "per_page" field in "response"
    And Assert users list has "total_pages" field in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: List users returns non-empty result
    When Send GET users list request and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert users list is not empty in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: List users with page and per_page params
    When Send GET users list request with page 1 per_page 5 and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert field "page" equals "1" in response "response"
    And Assert field "per_page" equals "5" in response "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: List users response does not include access_token
    When Send GET users list request and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert response body does not contain "access_token" in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: List users response has cache-control header
    When Send GET users list request and save response as "response"
    Then Get and check status code 200 from "response"
    And Assert response header "cache-control" contains "no-store" in "response"
