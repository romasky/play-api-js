@allure.label.epic:User_Lifecycle @allure.label.suite:User_Management @allure.label.subSuite:Create_User
Feature: Create User

  @Run @Smoke @Positive @allure.label.severity:critical @allure.label.story:Positive_Scenario
  Scenario: Create user with minimal required fields returns 201
    Given Generate email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "response"
    Then Get and check status code 201 from "response"
    And Assert field "email" equals "email" in response "response"
    And Assert field "username" equals "username" in response "response"
    And Assert field "access_token" is not null in response "response"
    And Assert field "id" is not null in response "response"
    And Assert response body does not contain "password" in "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Created user has correct metadata defaults
    Given Generate email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "response"
    Then Get and check status code 201 from "response"
    And Assert field "metadata.is_active" equals "true" in response "response"
    And Assert field "metadata.is_verified" equals "false" in response "response"
    And Assert field "metadata.login_count" equals "0" in response "response"
    And Assert field "metadata.role" equals "user" in response "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Access token has correct format after create
    Given Generate email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "response"
    Then Get and check status code 201 from "response"
    And Extract "access_token" from "response" and save as "token"
    And Assert "token" matches regex "^usr_\d+_[a-f0-9]{32}$"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user without email returns 400
    When Create user with raw body "{\"username\":\"testuser\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user with invalid email returns 400
    Given Generate invalid email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user without password returns 400
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"testuser\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user with short password returns 400
    Given Generate short password and save as "shortPass"
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"testuser\",\"password\":\"short\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user without profile returns 400
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"testuser\",\"password\":\"Pass_test123!1\"}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user without first_name returns 400
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"testuser\",\"password\":\"Pass_test123!1\",\"profile\":{\"last_name\":\"Doe\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user with short first_name returns 400
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"testuser\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"A\",\"last_name\":\"Doe\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user with short username returns 400
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"ab\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create duplicate user returns 409
    Given Generate email and save as "email_g"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "firstResponse"
    Then Get and check status code 201 from "firstResponse"

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user with duplicate email returns 409
    Given Save string "email_g" as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "response"
    Then Get and check status code 409 from "response"
    And Assert error code is "DUPLICATE_USER" in response "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario Outline: Create user with valid gender enum value
    Given Generate email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with raw body "{\"email\":\"<email_ph>\",\"username\":\"<user_ph>\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\",\"gender\":\"<gender>\"}}" and save response as "response"
    Then Get and check status code 201 from "response"
    Examples:
      | gender            | email_ph              | user_ph    |
      | male              | m1@play-qa.com        | user_m1    |
      | female            | f1@play-qa.com        | user_f1    |
      | other             | o1@play-qa.com        | user_o1    |
      | prefer_not_to_say | p1@play-qa.com        | user_p1    |

  @Run @Negative @allure.label.story:Negative_Scenario
  Scenario: Create user with invalid gender value returns 400
    When Create user with raw body "{\"email\":\"test@play-qa.com\",\"username\":\"testuser\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\",\"gender\":\"unknown\"}}" and save response as "response"
    Then Get and check status code 400 from "response"
    And Assert error code is "VALIDATION_ERROR" in response "response"

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario Outline: Create user with valid employment status
    When Create user with raw body "{\"email\":\"<email_ph>\",\"username\":\"<user_ph>\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\"},\"employment\":{\"status\":\"<status>\"}}" and save response as "response"
    Then Get and check status code 201 from "response"
    Examples:
      | status     | email_ph                | user_ph      |
      | employed   | emp1@play-qa.com        | user_emp1    |
      | unemployed | unemp1@play-qa.com      | user_unemp1  |
      | student    | stud1@play-qa.com       | user_stud1   |
      | retired    | ret1@play-qa.com        | user_ret1    |
      | freelancer | free1@play-qa.com       | user_free1   |

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario Outline: Create user with valid theme setting
    When Create user with raw body "{\"email\":\"<email_ph>\",\"username\":\"<user_ph>\",\"password\":\"Pass_test123!1\",\"profile\":{\"first_name\":\"John\",\"last_name\":\"Doe\"},\"settings\":{\"theme\":\"<theme>\"}}" and save response as "response"
    Then Get and check status code 201 from "response"
    Examples:
      | theme  | email_ph              | user_ph     |
      | light  | th1@play-qa.com       | user_th1    |
      | dark   | th2@play-qa.com       | user_th2    |
      | system | th3@play-qa.com       | user_th3    |

  @Run @Positive @allure.label.story:Positive_Scenario
  Scenario: Response headers include x-request-id after create
    Given Generate email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "response"
    Then Get and check status code 201 from "response"
    And Assert response header "x-request-id" is present in "response"

  @Run @Flow @allure.label.story:End_to_End_Flow
  Scenario: Create user then retrieve by ID
    Given Generate email and save as "email"
    And Generate username and save as "username"
    And Generate password and save as "password"
    And Generate first name and save as "firstName"
    And Generate last name and save as "lastName"
    When Create user with body and save response as "createResponse"
    Then Get and check status code 201 from "createResponse"
    And Extract "id" from "createResponse" and save as "userId"
    When Send GET user request for "userId" and save response as "getResponse"
    Then Get and check status code 200 from "getResponse"
    And Assert field "id" equals "userId" in response "getResponse"
