@allure.label.epic:Mail_Service @allure.label.suite:Mail_Service @allure.label.subSuite:Mailbox_Delete
Feature: Mailbox Delete

  @Run @Smoke @Positive @allure.label.severity:normal @allure.label.story:Positive_Scenario
  Scenario: Delete existing mailbox returns 204
    When Create mailbox and save response as "createRes"
    Then Get and check status code 201 from "createRes"
    And Extract "token" from "createRes" and save as "mailToken"
    When Delete mailbox with token "mailToken" and save response as "response"
    Then Get and check status code 204 from "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Deleted mailbox is not retrievable
    When Create mailbox and save response as "createRes"
    And Extract "token" from "createRes" and save as "mailToken"
    When Delete mailbox with token "mailToken" and save response as "deleteRes"
    Then Get and check status code 204 from "deleteRes"
    When Get mailbox with token "mailToken" and save response as "getRes"
    Then Get and check status code 404 from "getRes"
    And Assert error code is "MAILBOX_NOT_FOUND" in mail response "getRes"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Delete non-existent mailbox returns 404
    Given Generate fake uuid and save as "fakeToken"
    When Delete mailbox with token "fakeToken" and save response as "response"
    Then Get and check status code 404 from "response"
    And Assert error code is "MAILBOX_NOT_FOUND" in mail response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Delete already-deleted mailbox returns 404
    When Create mailbox and save response as "createRes"
    And Extract "token" from "createRes" and save as "mailToken"
    When Delete mailbox with token "mailToken" and save response as "firstDelete"
    Then Get and check status code 204 from "firstDelete"
    When Delete mailbox with token "mailToken" and save response as "secondDelete"
    Then Get and check status code 404 from "secondDelete"
    And Assert error code is "MAILBOX_NOT_FOUND" in mail response "secondDelete"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Messages are also deleted when mailbox is deleted
    When Create mailbox and save response as "createRes"
    And Extract "token" from "createRes" and save as "mailToken"
    When Send message to token "mailToken" from "test@example.com" subject "Hello" body "Test body" and save response as "sendRes"
    Then Get and check status code 201 from "sendRes"
    When Delete mailbox with token "mailToken" and save response as "deleteRes"
    Then Get and check status code 204 from "deleteRes"
    When Get messages for token "mailToken" and save response as "msgsRes"
    Then Get and check status code 404 from "msgsRes"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Response 204 has no body
    When Create mailbox and save response as "createRes"
    And Extract "token" from "createRes" and save as "mailToken"
    When Delete mailbox with token "mailToken" and save response as "response"
    Then Get and check status code 204 from "response"
    And Assert response body does not contain "error" in "response"

  @Run @Flow @allure.label.story:End_to_End_Flow
  Scenario: Full mailbox lifecycle
    When Create mailbox and save response as "createRes"
    Then Get and check status code 201 from "createRes"
    And Extract "token" from "createRes" and save as "mailToken"
    When Get mailbox with token "mailToken" and save response as "getRes"
    Then Get and check status code 200 from "getRes"
    When Delete mailbox with token "mailToken" and save response as "deleteRes"
    Then Get and check status code 204 from "deleteRes"
    When Get mailbox with token "mailToken" and save response as "afterDeleteRes"
    Then Get and check status code 404 from "afterDeleteRes"
