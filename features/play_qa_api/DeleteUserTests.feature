@allure.label.epic:User_Lifecycle @allure.label.suite:User_Management @allure.label.subSuite:Delete_User
Feature: Delete User

  @Run @Smoke @Positive @allure.label.severity:critical @allure.label.story:Positive_Scenario
  Scenario: Delete existing user returns 204
    Given Create minimal user and save response as "createRes"
    And Extract "id" from "createRes" and save as "userId"
    And Extract "access_token" from "createRes" and save as "token"
    When Delete user "userId" with token "token" and save response as "response"
    Then Get and check status code 204 from "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Deleted user is no longer findable via GET
    Given Create minimal user and save response as "createRes"
    And Extract "id" from "createRes" and save as "userId"
    And Extract "access_token" from "createRes" and save as "token"
    When Delete user "userId" with token "token" and save response as "deleteRes"
    Then Get and check status code 204 from "deleteRes"
    When Send GET user request for "userId" and save response as "getRes"
    Then Get and check status code 404 from "getRes"
    And Assert error code is "USER_NOT_FOUND" in response "getRes"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Delete user without token returns 401
    Given Create minimal user and save response as "createRes"
    And Extract "id" from "createRes" and save as "userId"
    When Delete user "userId" with token "fake_token" and save response as "response"
    Then Get and check status code 401 from "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Delete user with wrong token returns 401
    Given Create minimal user and save response as "createRes"
    And Extract "id" from "createRes" and save as "userId"
    And Save string "usr_0000000000_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as "wrongToken"
    When Delete user "userId" with token "wrongToken" and save response as "response"
    Then Get and check status code 401 from "response"
    And Assert error code is "INVALID_TOKEN" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Delete non-existent user returns 401 (no valid token)
    Given Generate fake mongo id and save as "fakeId"
    When Delete user "fakeId" with token "fake_token" and save response as "response"
    Then Get and check status code 401 from "response"

  @Run @Flow @allure.label.story:End_to_End_Flow
  Scenario: Create, delete, confirm HEAD returns 404
    Given Create minimal user and save response as "createRes"
    And Extract "id" from "createRes" and save as "userId"
    And Extract "access_token" from "createRes" and save as "token"
    When Delete user "userId" with token "token" and save response as "deleteRes"
    Then Get and check status code 204 from "deleteRes"
    When Send HEAD exists request for "userId" and save response as "existsRes"
    Then Get and check status code 404 from "existsRes"
    And Assert response header "x-user-exists" equals "false" in "existsRes"
