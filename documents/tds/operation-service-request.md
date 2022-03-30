# Service Request Execution

This document will explain complex service execution process.

## Definition of Service Request

Service or operation request is work specific task feature which is not available as application feature like Database extract, database update, KeyCloak configuration change.

## Complex Service Request

A complex service request is a task to update one or more database entities. This kind of requests requires audit trail for accountability and compliances.

## How to run Script based service request task

- Task should be implemented and deployed on respective env

- Go to [HCAP Github repo](https://github.com/bcgov/hcap). Then Select `Action` tab.

- Select [Env] - Service Pod action from left panel

- In action details section of right panel, select run workflow.

- In run-workflow modal, select field values
  
  - Image tag - [dev/test/prod]
  
  - The service configuration string - JSON or Property string

    - Example JSON

      ```json
      {"service":"changeCohort","participantId":24,"oldCohort":"W22.22","oldPSI":"Tech Fresh","newCohort":"S2211","newPSI":"Tech Fresh"}
      ```

    - Example Property String

    ```txt
    service=changeCohort;participantId=16090;newPSI=Freshworks Tech;newCohort=M4.2022;oldCohort=M12.2021;oldPSI=Freshworks Tech;
    ```
  
  - Press `Run Workflow` button

Above action will dispatch a service `Pod` in respective OpenShift environment. To check status of the service execution

- Login into OpenShift web console

- Select respective env namespace/project

- Select workload (Administrator mode) / search pods (in Developer mode)

- Find and select `hcap-service-pod`

- Check logs
