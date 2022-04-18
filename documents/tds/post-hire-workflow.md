# Post Hire Workflow

## Info

    Status:     Initial version
    Version:    1.0
    Created On: 1-Feb-2022
    Update On:  14-Feb-2022

## History

| Version | Description | Status |
| ------- | ----------- | -------
|   1.0   | Initial version | Draft |
|   1.0.1 | HCAP-1038 | |

## Tickets

**User Story:**  [HCAP-1030](https://freshworks.atlassian.net/browse/HCAP-1030)

**User Story:** [HCAP-1038](https://freshworks.atlassian.net/browse/HCAP-1038)

## Contents

- [Feature Description](#feature-description)
- [Data Flow Diagram](#data-flow-diagram)
- [Database](#database)
- [API](#api)
- [Service](#service)

## Feature Description

As the HA, I want to be able to track the completion of education for a HCAP participant, so I can ensure that there is no impact to funding and that the participant is on the right track to becoming a HCA.

## Data Flow Diagram

![FlowDiagram](/documents/assets/Post-hire-flow.drawio.png)

## Database

- Create table `participant_post_hire_status`
  columns:
  - id: Int or UUID | Primary key
  
  - status: VARCHAR(255) | This field will be represented by application level enum (Orientation / Post Secondary Education / Graduated / Fail Cohort)

  - participant_id: INT | Foreign key to participant table

  - data: JSONB | To store status related info

  - current: Boolean | To indicate Current status or not

  - created_at: TIMESTAMP | Time of creation

  - updated_at: TIMESTAMP | Time of update

## API

- Create new end-point:
  - /post-hire-status: with methods POST
    - Cohort assignment validation should performed
  - /post-hire-status/:id: methods PATCH, GET
  - /participant/:participantId/post-hire-status - Get all post-hire status of the participant

## Service

- Add new service method `getPostHireStatusesForParticipant()`
  - parameter: participantId
  - parameter: Filter Options (optional)
- Update participant service method `getParticipants`@`services/participants.js`
  - Use `getPostHireStatusesForParticipant()` to fetch details of each participant and merge with existing response.
