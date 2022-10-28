/* System & Helpers */
const COMPANY_NAME = 'Insightt';

const COMPANY_CONTACT = 'support@insightt.io';

const COMPANY_REPORT_TIME = 9;

const DEFAULT_SERVER_LABEL = '(GMT+00:00) UTC';

const DEFAULT_SERVER_TIMEZONE = 'UTC';

const DEFAULT_SERVER_TIMEZONE_VALUE = 0;

const DEVICE_TYPES = {
  web: 'web',
  mobile: 'mobile',
};

const ALERT_METHODS = {
  sms: 'sms',
  email: 'email',
};

const DATABASE_TYPES = {
  company_db: 'company_db',
  platform_db: 'platform_db',
};

const CHECK_TRACK_LOCATION_INTERVAL = 1;

const ALERT_WHEN_TASK_REMAINING_PERCENTAGE = 20;

const INFRACTION_TYPES = {
  shift_start_later: 'shift_start_later',
  shift_end_early: 'shift_end_early',
  shift_inactivity: 'shift_inactivity',
  shift_being_idle: 'shift_being_idle',
  shift_being_offline: 'shift_being_offline',
  shift_being_idle_offline: 'shift_being_idle_offline',
  shift_break_over_time: 'shift_break_over_time',
  task_not_completed_in_time: 'task_not_completed_in_time',
  location_value_invalid: 'location_value_invalid',
};

const COMPANY_WIDE_BRANCH_ID = 0;

const UNKNOWN_BRANCH_ID = -1;

const EXPIRY_TIME_ALERTS_FEED = 8;

const VALID_IMAGE_TYPES = ['bmp', 'cis-cod', 'gif', 'jpeg', 'jpg', 'svg+xml', 'png'];

const END_SHIFT_TYPES = {
  manual: 'manual',
  system: 'system',
  duplicate_login: 'duplicate_login',
};

const YTD = 'ytd';
const MONTH = 'month';
const WEEK = 'week';
const TODAY = 'today';

/* User Roles & Types */
const SYSTEM_ADMIN_ROLE = 'system_admin';
const SUPER_ADMIN_ROLE = 'super_admin';
const ADMIN_ROLE = 'admin';
const MANAGER_ROLE = 'manager';
const DRIVER_ROLE = 'driver';

const SYSTEM_ADMIN = 'system_admin';
const SUPER_ADMIN = 'super_admin';
const ADMINISTRATOR = 'administrator';
const ADMIN_REP = 'admin_rep';
const BRANCH_MANAGER = 'branch_manager';
const INVESTIGATOR = 'investigator';
const RECOVERY_AGENT = 'recovery_agent';
const SPOTTER = 'spotter';
const CAMERA_CAR = 'camera_car';

const ALL_ROLES = [
  SYSTEM_ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  ADMINISTRATOR,
  ADMIN_ROLE,
  MANAGER_ROLE,
  DRIVER_ROLE,
  SPOTTER,
  RECOVERY_AGENT,
];
const ADMIN_ROLES = [SUPER_ADMIN_ROLE, ADMIN_ROLE];

const MANAGER_ROLES = [SUPER_ADMIN, MANAGER_ROLE, ADMINISTRATOR];

const AUTO_SAVE = 'auto_save';
const ENABLED = 'enabled';
const DISABLED = 'disabled';

const TASK_CATEGORY = {
  ALL: 'all',
  MY_TASKS: 'my_tasks',
  ASSIGNED_TO_OTHER_TASKS: 'assigned_to_other_tasks',
};

const TASK_SUB_CATEGORY = {
  ALL: 'all',
  COMPLETED: 'completed',
  PENDING_APPROVAL: 'pending_approval',
  INCOMPLETE: 'incomplete',
};

/* Manage Checklist */
const CHECKLIST_TYPES = {
  new_hire: 'new_hire',
  terminate: 'terminate',
  start_shift: 'start_shift',
  end_shift: 'end_shift',
  activity_tracker: 'activity_tracker',
  motion_tracker: 'motion_tracker',
};

const CHECKLIST_STATUSES = {
  yes: 'Yes',
  no: 'No',
};

const COMMENT_TYPES = {
  checklist: 'checklist',
  manual_hot_case: 'manual_hot_case',
};

/* Manage Shifts */
const TIME_CLOCK_TYPES = {
  break: 'break',
  activity_tracker: 'activity_tracker',
  motion_tracker: 'motion_tracker',
};

const COMMISSION_TYPES = {
  individual: 'individual',
  team: 'team',
  per_vehicle: 'per_vehicle',
  custom: 'custom',
};

const COMMISSION_STATUSES = {
  approved: 'approved',
  pending: 'pending',
  declined: 'declined',
};

const COMPANY_USER_STATUS = {
  approved: 'approved',
  pending: 'pending',
  rejected: 'rejected',
  in_active: 'in_active',
  suspended: 'suspended',
};

const INTRO_VIDEOS = {
  [RECOVERY_AGENT]: {
    video: 'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome+Recovery+Agent.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
  [SPOTTER]: {
    video:
      'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome%20Spotter%3ACamera%20Car%3AInvestigator.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
  [CAMERA_CAR]: {
    video:
      'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome%20Spotter%3ACamera%20Car%3AInvestigator.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
  [INVESTIGATOR]: {
    video:
      'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome%20Spotter%3ACamera%20Car%3AInvestigator.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
  [SUPER_ADMIN]: {
    video: 'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome+Management+v2.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
  [BRANCH_MANAGER]: {
    video: 'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome+Management+v2.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
  [ADMINISTRATOR]: {
    video: 'https://insightt-videos.s3.us-east-2.amazonaws.com/Welcome+Management+v2.mp4',
    thumbnail: 'https://insightt-videos.s3.us-east-2.amazonaws.com/thumbnails/recovery-agent.gif',
  },
};

const AWS_CHECKLIST_BUCKET_NAME = 'checklist';
const AWS_PROFILE_PICS_BUCKET_NAME = 'profile-pics';
const AWS_EMPLOYMENT_FILES_BUCKET_NAME = 'employment-files';
const AWS_MAP_REPORTS_BUCKET = 'email-maps';

const USER = 'user';
const CLIENT = 'client';
const CLIENT_AND_USER = 'clientAndUser';

/* Email maps */
const EMAIL_MAPS = {
  bucket: 'insightt-email-templates',
  default_image: 'https://insightt-videos.s3.us-east-2.amazonaws.com/map.png',
};

const RDN_IMPORT_METRICS = {
  seconds_per_batch: 10 * 60, // 10 minutes
  days_per_batch: 14,
};

/* User Shift */
const SHIFT_TYPES = {
  normal_shift: 'normal_shift',
  extraneous_time_tracked: 'extraneous_time_tracked',
};

const SHIFT_STATUSES = {
  working: 'working',
  breaking: 'breaking',
  paused: 'paused',
  ended: 'ended',
};

const USER_ACTIVITIES = {
  rdn: 'rdn',
  time_clock: 'time_clock',
  shift: 'shift',
  commission: 'commission',
  profile: 'profile',
  checklist: 'checklist',
  timesheet: 'timesheet',
};

const BREAK_TIME_TYPES = {
  break: 'break',
  pause: 'pause',
  idle: 'idle', // idle time
  offline: 'offline',
  idle_offline: 'idle_offline',
  inactivity: 'inactivity', // RDN inactivity
};

const COMPANY_WIDE = 'Company Wide';
const UNKNOWN = 'Unknown';

const SCANNED = 'scanned';
const SECURED = 'secured';
const LPR_HITS = 'lpr_hits';
const DIRECT_HITS = 'direct_hits';
const TOTAL_COUNT_HITS = 'total_count_hits';
const ALL_HITS = 'all_hits';

const BRANCH_NAMES = {
  main: 'Main',
  fort_Pierce: 'Fort Pierce',
  orlando: 'Orlando',
  tampa: 'Tampa',
  jacksonville: 'Jacksonville',
  company_wide: 'Company Wide',
  unknown: 'Unknown',
};

const REFERESH_TOKEN_INTERVAL_BEFORE_EXPIRE = 600;

// Employee can only have shifts that are 15 minutes from their shift's end time.
const LIMIT_NORMAL_SHIFTS_IN_MINUTES = 15;

// Employee can only have shifts that are 10 hours from when they started the manual shift.
const LIMIT_MANUAL_SHIFTS_IN_HOURS = 10;

// If start shift later 20 mins or greater, then it's shift infraction
const SHIFT_INFRACTION_START_LATER_LIMIT_MINUTES = 20;

// If end shift early 20 mins or greater, then it's shift infraction
const SHIFT_INFRACTION_END_EARLY_LIMIT_MINUTES = 20;

// If end break later 2 mins or greater than the alloted time, then it's shift infraction
const SHIFT_INFRACTION_BREAK_OVERTIME_LIMIT_MINUTES = 2;

// If vehicle has been spotted by another spotter already, it can be reset to be spotted freshly after 10 hours
const SPOTTED_VEHICLE_LIMITI_TIME_HOURS = 18;

// When vehicle is spotted, notify nearby recovery agents within 2 miles
const SPOTTED_VEHICLE_DISTANCE_FOR_NEARBY_AGENTS = 2;

// RDN Activity Tracker will be checking out users' shifts after 40 minutes once they started a shift
const SHIFT_RDN_TRACKER_START_LIMIT_MINUTES = 40;

// Default Motion Tracker Interval for manual time
const MANUAL_TIME_MOTION_TRACKER_INTERVAL_MINUTES = 10;

// Earth's mean radius in meter
const EARTH_RADIUS_IN_METER = 6378137;

// Pagination limit
const PAGINATION_LIMIT = 10;

// Average speed used to determine being idle, in mph (miles per hour)
const BEING_IDLE_LIMIT_SPEED = 0;

const MINIMUM_METER_FOR_ONE_SECOND = 1;

const MINIMUM_VIN_LENGTH = 6;

const PUSH_NOTIFICATION_TTL = '60';

const SPOTTED_FROM_TIME = 9;

const SPOTTED_TO_TIME = 9;

const SPOTTED_NOT_SECURED_FROM_TIME = 9;

const SPOTTED_NOT_SECURED_TO_TIME = 9;

const SCANS_FROM_TIME = 9;

const SCANS_TO_TIME = 9;

const ASSIGNMENT_FROM_TIME = 0;

const ASSIGNMENT_TO_TIME = 0;

const REPOSSESSIONS_FROM_TIME = 9;

const REPOSSESSIONS_TO_TIME = 9;

const ASSIGNED = 'assigned';

const RECEIVED = 'received';

// max idle limit
const MAX_IDLE_LIMIT = 2;

const ALLOWED_INACTIVE_OR_MOTION_LIMIT_OVER_SHIFT_TIME = 2;

const DAILY = 'daily';

const WEEKLY = 'weekly';

const INSIGHTT = 'insightt';

/* Manager Shift */
const SHIFT_FEED_CATEGORIES = {
  alert: 'alert',
  infraction: 'infraction',
  commission: 'commission',
  failed_checklist: 'failed_checklist',
  manual_hot_list: 'manual_hot_list',
};

// Based on RDN document update type value
const AGENT_UPDATE_TYPES = [
  6, // Agent-Update
  11, // Agent-Other
  13, // Address update
  14, // User Update
  30, // Agent Runsheet Update
  34, // User First Hit Update
  35, // Agent First Hit Update
  36, // (O)Agent-Update
  101, // (O) Address Update
  102, // Agent GPS Update
  109, // Agent-Recovery
  110, // Agent-C/R
  112, // First Update
  113, // Agent-Completed
  115, // ClearPlan Note
  119, // Repossession process initiated
  122, // GPS Update
  124, // On Hook
  125, // Address not valid for debtor, contact established
  126, // Address is Vacant
  127, // Address Does not Exist
  128, // Address Inaccessible (Guard/Gated)
  129, // Multiple attempts, unable to contact
  130, // Address is Valid for Debtor - Unit Unrecoverable
  131, // Address Valid - Unit Located at Alternate Address
  132, // Address is Valid - Debtor Violent
  133, // Other - Address Update
  134, // Address occupied, will continue recovery efforts
  135, // Address Confirmed Valid - Collateral Not Present
  136, // Address Confirmed - Collateral Inaccessible
  137, // Address Confirmed - Debtor Unwilling to Surrender
  138, // Information Needed (Unit Number, Job Title Department, etc.)
  139, // (O) Address not valid for debtor, contact established
  140, // (O) Address is Vacant
  141, // (O) Address Does not Exist
  142, // (O) Address Inaccessible (Guard/Gated)
  143, // (O) Multiple attempts, unable to contact
  144, // (O) Address is Valid for Debtor - Unit Unrecoverable
  145, // (O) Address Valid - Unit Located at Alternate Address
  146, // (O) Address is Valid - Debtor Violent
  147, // (O) Other - Address Update
  148, // (O) Address occupied, will continue recovery efforts
  149, // (O) Address Confirmed Valid - Collateral Not Present
  150, // (O) Address Confirmed - Collateral Inaccessible
  151, // (O) Address Confirmed - Debtor Unwilling to Surrender
  152, // (O) Information Needed (Unit Number, Job Title Department, etc.)
];

const USER_ACTIVITY_TYPE = {
  drive_time_hours: 'drive_time_hours',
  infraction: 'infraction',
  missed_opportunities: 'missed_opportunities',
  spotted_vehicles: 'spotted_vehicles',
  repossessions: 'repossessions',
  total_hours_worked: 'total_hours_worked',
  total_commissions: 'total_commissions',
  task_stats: 'task_stats',
};

const SHIFT_FEED_TYPES = {
  shift_start_later: INFRACTION_TYPES.shift_start_later,
  shift_end_early: INFRACTION_TYPES.shift_end_early,
  shift_inactivity: INFRACTION_TYPES.shift_inactivity,
  shift_being_idle: INFRACTION_TYPES.shift_being_idle,
  shift_being_offline: INFRACTION_TYPES.shift_being_offline,
  shift_being_idle_offline: INFRACTION_TYPES.shift_being_idle_offline,
  shift_break_over_time: INFRACTION_TYPES.shift_break_over_time,
  shift_break_start: 'shift_break_start',
  shift_pause_start: 'shift_pause_start',
  shift_end_over_time: 'shift_end_over_time',
  shift_failed_checklist: 'shift_failed_checklist',
  shift_manual_hot_list: 'shift_manual_hot_list',
  custom_commission_request: 'custom_commission_request',
  new_individual_commission: 'new_individual_commission',
  new_team_commission: 'new_team_commission',
  new_vehicle_commission: 'new_vehicle_commission',
  location_value_invalid: 'location_value_invalid',
};

/* Task Management */
const TASK_STATUSES = {
  open: 'open',
  closed: 'closed',
  completed: 'completed',
  new_deadline_proposed: 'new_deadline_proposed',
  new_deadline_approved: 'new_deadline_approved',
  new_deadline_cancelled: 'new_deadline_cancelled',
  new_deadline_declined: 'new_deadline_declined',
  marked_as_completed: 'marked_as_completed',
  uncompleted: 'uncompleted',
  acknowledged_uncompleted: 'acknowledged_uncompleted',
};

const COMPLETED_TASKS = [TASK_STATUSES.closed, TASK_STATUSES.completed, TASK_STATUSES.marked_as_completed];

const INCOMPLETED_TASKS = [TASK_STATUSES.uncompleted];

const PENDING_APPROVAL_TASKS = [TASK_STATUSES.new_deadline_proposed];

const NOTIFY_TYPE = {
  idle_notify: 'idle_notify',
  offline_notify: 'offline_notify',
  idle_offline_notify: 'idle_offline_notify',
  location_invalid_notify: 'location_invalid_notify',
};

const SECONDS_BEFORE_OFFLINE_TRACKING = 150;

const TASK_URGENCIES = {
  high: 'high',
  medium: 'medium',
  low: 'low',
};

/* Notifications */
const NOTIFICATION_CATEGORIES = {
  for_user: 'for_user',
  for_manager: 'for_manager',
};

/* User status */
const USER_STATUS = {
  active: 'ACTIVE',
  disabled: 'DISABLED',
};

const NOTIFICATION_TYPES = {
  RDN_Infraction: 'RDN_Infraction',
  Idle_Infraction: 'Idle_Infraction',
  task_created: 'task_created',
  task_closed: 'task_closed',
  task_completed: 'task_completed',
  task_uncompleted: 'task_uncompleted',
  task_read: 'task_read',
  task_unread: 'task_unread',
  task_approved_new_deadline: 'task_approved_new_deadline',
  task_declined_new_deadline: 'task_declined_new_deadline',
  task_proposed_new_deadline: 'task_proposed_new_deadline',
  task_cancelled_new_deadline: 'task_cancelled_new_deadline',
  task_marked_as_completed: 'task_marked_as_completed',
  task_alloted_time_reminder: 'task_alloted_time_reminder',
  shift_created: 'shift_created',
  shift_start_later: INFRACTION_TYPES.shift_start_later,
  shift_end_early: INFRACTION_TYPES.shift_end_early,
  shift_inactivity: INFRACTION_TYPES.shift_inactivity,
  shift_being_idle: INFRACTION_TYPES.shift_being_idle,
  shift_break_over_time: INFRACTION_TYPES.shift_break_over_time,
  shift_break_start: 'shift_break_start',
  shift_pause_start: 'shift_pause_start',
  shift_end_over_time: 'shift_end_over_time',
  shift_failed_checklist: 'shift_failed_checklist',
  shift_manual_hot_list: 'shift_manual_hot_list',
  shift_nearby_spotted_vehicle: 'shift_nearby_spotted_vehicle',
  custom_commission_request: 'custom_commission_request',
  new_individual_commission: 'new_individual_commission',
  new_team_commission: 'new_team_commission',
  new_vehicle_commission: 'new_vehicle_commission',
  location_value_invalid: 'location_value_invalid',
  subscription_changed: 'subscription_changed',
  ping: 'ping',
};

const NOTIFICATION_TEXTS = {
  shift_start_later: 'Shift start later',
  shift_end_early: 'Shift ended early',
  shift_inactivity: 'Shift inactive',
  shift_being_idle: 'Idle motion infraction',
  shift_break_over_time: 'Shift break went over time',
  location_value_invalid: 'Location is not valid',
};

const NOTIFICATION_DESCRIPTIONS = {
  shift_inactivity:
    'Due to inactivity on RDN, Management has requested an explanation. Please Provide details below.',
  shift_being_idle:
    'Due to your reduced driving movement, Management has requested an explanation. Please Provide details below',
};

const NOTIFICATION_NOT_SEND_TO_ADMIN = {
  RDN_Infraction: NOTIFICATION_TYPES.RDN_Infraction,
  Idle_Infraction: NOTIFICATION_TYPES.Idle_Infraction,
  location_value_invalid: NOTIFICATION_TYPES.location_value_invalid,
  shift_inactivity: INFRACTION_TYPES.shift_inactivity,
  shift_being_idle: INFRACTION_TYPES.shift_being_idle,
};

const NOTIFICATION_COLOR = {
  default: '#000',
  RDN_Infraction: '#F24949',
  Idle_Infraction: '#F24949',
  task_created: '#FC9E3F',
  task_read: '#FC9E3F',
  task_unread: '#FC9E3F',
  task_closed: '#006AFF',
  task_completed: '#13BF94',
  task_uncompleted: '#F24949',
  task_approved_new_deadline: '#006AFF',
  task_declined_new_deadline: '#F24949',
  task_proposed_new_deadline: '#006AFF',
  task_cancelled_new_deadline: '#F24949',
  task_marked_as_completed: '#13BF94',
  task_alloted_time_reminder: '#965BE8',
  shift_start_later: '#F24949',
  shift_end_early: '#F24949',
  shift_inactivity: '#F24949',
  shift_being_idle: '#F24949',
  shift_break_over_time: '#F24949',
  shift_break_start: '#006AFF',
  shift_pause_start: '#FC9E3F',
  shift_end_over_time: '#F24949',
  shift_failed_checklist: '#F24949',
  shift_manual_hot_list: '#965BE8',
  shift_nearby_spotted_vehicle: '#965BE8',
  custom_commission_request: '#006AFF',
  location_value_invalid: '#FC9E3F',
  subscription_changed: '#006AFF',
};

const NOTIFICATION_STATUSES = {
  created: 'created',
  read: 'read',
};

const WORKER_TASKS = {
  dailyReport: 'daily_report',
  trackLocation: 'track_location',
  notifyIdleShifts: 'notify_idle_shifts',
  trackRdnActivities: 'track_rdn_activities',
  unknownCompanyRegistrationRequest: 'unknown_company_registration_request',
  unknownCompanyRegistrationAcknowledge: 'unknown_company_registration_acknowledge',
  fetchRdnCases: 'fetchRdnCases',
  updateRDNBranchName: 'updateRDNBranchName',
  processRdnCases: 'process_rdn_cases',
  syncRdnData: 'sync_rdn_data',
  syncDrnData: 'sync_drn_data',
  fetchRdnEvents: 'fetch_rdn_events',
  addCameraScans: 'add_camera_scans',
  addCameraScansAndHits: 'add_camera_scans_and_hits',
  calcShiftCommission: 'calc_shift_commission',
  closeOverShiftTimes: 'close_over_shift_times',
  sendTaskReminders: 'send_task_reminders',
  markUncompletedTasks: 'mark_uncompleted_tasks',
  checkShiftBreakOverTime: 'check_shift_break_over_time',
  bibleRequest: 'bible_request',
  checkBranchesWithDuplicateZipCodes: 'check_branches_with_duplicate_zipCodes',
  duplicateZipCodes: 'duplicate_zipcodes',
  missedRepossessionAlert: 'missed_repossession_alert',
  completeCompanyRegistration: 'complete_company_registration',
  CREATE_MISSED_REPOSSESSION: 'CREATE_MISSED_REPOSSESSION',
};

const EMAIL_TEMPLATE_NAMES = {
  unknownCompanyRegistrationRequest: 'unknown-company-registration-request',
  unknownCompanyRegistrationAcknowledge: 'unknown-company-registration-acknowledge',
  bibleRequest: 'bible-request',
  bibleConfirmationMail: 'bible-confirmation-mail',
  duplicateZipCodes: 'duplicate-zipcodes',
  missedRepossessionAlert: 'missed-repossession-alert',
};

const EMAIL_SUBJECT_NAMES = {
  unknownCompanyRegistrationRequest: 'Company registration request',
  unknownCompanyRegistrationAcknowledge: 'Company registration acknowledge',
  bibleRequest: 'Bible request',
  bibleConfirmationMail: 'Bible confirmation mail',
  duplicateZipCodes: 'Duplicate zipcodes',
  missedRepossessionAlert: 'Missed repossession alert',
};

const SYSTEM_ADMIN_EMAIL_FOR_BIBLE_REQUEST = ['bhamilton@insightt.io', 'bhamilton@rapidrecoveryagency.com'];

const LOCAL_EVENTS = {
  new_commission: 'new_commission',
  refresh_shift_data: 'refresh_shift_data',
};

const CONTACT_US_MAIL = 'bhamilton@insightt.io';

const SPOTTED_VEHICLE = 'SPOTTED_VEHICLE';
const REPOSSESSED_VEHICLE = 'REPOSSESSED_VEHICLE';

const DRN_BUNCH_LIMIT = 10;
const WEEKLY_HOUR_LIMIT_IN_SECONDS = 40 * 60 * 60; // 40 hours

const DISPOSITION_STATUS = {
  Stored: 'Stored',
  Del_To_Auction: 'Del To Auction',
  Del_To_Client: 'Del To Client',
  Del_To_Dealer: 'Del To Dealer',
  Del_To_Debtor: 'Del To Debtor',
  Del_To_Other: 'Del To Other',
  In_Auction: 'In Auction',
  Redemption_Hold: 'Redemption Hold',
  Rel_To_Auction: 'Rel To Auction',
  Rel_To_Client: 'Rel To Client',
  Rel_To_Debtor: 'Rel To Debtor',
  Rel_To_Other: 'Rel To Other',
  RO_Redeemed: 'RO Redeemed',
  Sold_In_Auction: 'Sold In Auction',
  I_P: 'I/P',
};

const CASE_RECORD_STATUS = {
  NEW: 'NEW',
  PROCESSED: 'PROCESSED',
};

const INFRACTION_STATUS = {
  draft: 'draft',
  saved: 'saved',
};

module.exports = {
  CASE_RECORD_STATUS,
  // System & Helpers
  COMPANY_NAME,
  COMPANY_CONTACT,
  COMPANY_REPORT_TIME,
  DEFAULT_SERVER_TIMEZONE,
  DEVICE_TYPES,
  ALERT_METHODS,
  INFRACTION_TYPES,
  // User Roles & Types
  SYSTEM_ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  MANAGER_ROLE,
  DRN_BUNCH_LIMIT,
  DRIVER_ROLE,
  ADMIN_ROLES,
  CONTACT_US_MAIL,
  ALL_ROLES,
  MANAGER_ROLES,
  SYSTEM_ADMIN,
  SUPER_ADMIN,
  ADMINISTRATOR,
  ADMIN_REP,
  YTD,
  MONTH,
  WEEK,
  TODAY,
  BRANCH_MANAGER,
  INVESTIGATOR,
  RECOVERY_AGENT,
  SPOTTER,
  CAMERA_CAR,
  // Manage Checklist
  CHECKLIST_TYPES,
  CHECKLIST_STATUSES,
  COMMENT_TYPES,
  // Manage Shifts
  TIME_CLOCK_TYPES,
  COMMISSION_TYPES,
  COMMISSION_STATUSES,
  // User Shift
  SHIFT_TYPES,
  SHIFT_STATUSES,
  BREAK_TIME_TYPES,
  LIMIT_NORMAL_SHIFTS_IN_MINUTES,
  SHIFT_INFRACTION_START_LATER_LIMIT_MINUTES,
  SHIFT_INFRACTION_END_EARLY_LIMIT_MINUTES,
  SHIFT_INFRACTION_BREAK_OVERTIME_LIMIT_MINUTES,
  SPOTTED_VEHICLE_LIMITI_TIME_HOURS,
  SPOTTED_VEHICLE_DISTANCE_FOR_NEARBY_AGENTS,
  SHIFT_RDN_TRACKER_START_LIMIT_MINUTES,
  MANUAL_TIME_MOTION_TRACKER_INTERVAL_MINUTES,
  EARTH_RADIUS_IN_METER,
  PAGINATION_LIMIT,
  BEING_IDLE_LIMIT_SPEED,
  // Manager Shift
  SHIFT_FEED_CATEGORIES,
  SHIFT_FEED_TYPES,
  USER_ACTIVITIES,
  // Task Management
  TASK_STATUSES,
  TASK_URGENCIES,
  // Notifications
  NOTIFICATION_CATEGORIES,
  NOTIFY_TYPE,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
  NOTIFICATION_STATUSES,
  MINIMUM_METER_FOR_ONE_SECOND,
  COMPANY_WIDE_BRANCH_ID,
  MAX_IDLE_LIMIT,
  USER_STATUS,
  BRANCH_NAMES,
  AGENT_UPDATE_TYPES,
  AUTO_SAVE,
  ENABLED,
  DISABLED,
  EXPIRY_TIME_ALERTS_FEED,
  NOTIFICATION_NOT_SEND_TO_ADMIN,
  NOTIFICATION_TEXTS,
  NOTIFICATION_DESCRIPTIONS,
  ALLOWED_INACTIVE_OR_MOTION_LIMIT_OVER_SHIFT_TIME,
  MINIMUM_VIN_LENGTH,
  DAILY,
  WEEKLY,
  USER_ACTIVITY_TYPE,
  VALID_IMAGE_TYPES,
  DATABASE_TYPES,
  COMPANY_USER_STATUS,
  AWS_CHECKLIST_BUCKET_NAME,
  AWS_PROFILE_PICS_BUCKET_NAME,
  AWS_EMPLOYMENT_FILES_BUCKET_NAME,
  AWS_MAP_REPORTS_BUCKET,
  CHECK_TRACK_LOCATION_INTERVAL,
  COMPANY_WIDE,
  UNKNOWN,
  ALERT_WHEN_TASK_REMAINING_PERCENTAGE,
  UNKNOWN_BRANCH_ID,
  REFERESH_TOKEN_INTERVAL_BEFORE_EXPIRE,
  SCANNED,
  SECURED,
  LPR_HITS,
  ALL_HITS,
  DIRECT_HITS,
  TOTAL_COUNT_HITS,
  INSIGHTT,
  PUSH_NOTIFICATION_TTL,
  SPOTTED_FROM_TIME,
  SPOTTED_TO_TIME,
  SCANS_FROM_TIME,
  SCANS_TO_TIME,
  ASSIGNMENT_FROM_TIME,
  ASSIGNMENT_TO_TIME,
  REPOSSESSIONS_FROM_TIME,
  DEFAULT_SERVER_TIMEZONE_VALUE,
  REPOSSESSIONS_TO_TIME,
  SPOTTED_NOT_SECURED_FROM_TIME,
  SPOTTED_NOT_SECURED_TO_TIME,
  DEFAULT_SERVER_LABEL,
  TASK_CATEGORY,
  COMPLETED_TASKS,
  INCOMPLETED_TASKS,
  PENDING_APPROVAL_TASKS,
  TASK_SUB_CATEGORY,
  ASSIGNED,
  RECEIVED,
  USER,
  CLIENT,
  EMAIL_MAPS,
  RDN_IMPORT_METRICS,
  // Worker tasks
  WORKER_TASKS,
  CLIENT_AND_USER,
  END_SHIFT_TYPES,
  EMAIL_TEMPLATE_NAMES,
  EMAIL_SUBJECT_NAMES,
  SYSTEM_ADMIN_EMAIL_FOR_BIBLE_REQUEST,
  SPOTTED_VEHICLE,
  REPOSSESSED_VEHICLE,
  INTRO_VIDEOS,
  LIMIT_MANUAL_SHIFTS_IN_HOURS,
  SECONDS_BEFORE_OFFLINE_TRACKING,
  WEEKLY_HOUR_LIMIT_IN_SECONDS,
  LOCAL_EVENTS,
  DISPOSITION_STATUS,
  INFRACTION_STATUS,
};
