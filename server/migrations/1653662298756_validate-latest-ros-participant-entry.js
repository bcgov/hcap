/* eslint-disable camelcase */
import { dbClient, collections } from '../db';

exports.shorthands = 'validate-latest-ros-participant-entry';

exports.up = async () => {
  await dbClient.db.query(`
    WITH participant_latest_ros as (
      SELECT distinct participant_id, MAX(id) as latest_id  
      FROM ${collections.ROS_STATUS} 
      GROUP by participant_id 
      ORDER by participant_id
    )
    UPDATE ${collections.ROS_STATUS}
    SET is_current = true
    FROM participant_latest_ros
    WHERE ${collections.ROS_STATUS}.id = participant_latest_ros.latest_id;
  `);
};
