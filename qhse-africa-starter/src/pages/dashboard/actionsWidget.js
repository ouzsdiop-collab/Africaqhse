import { createDashboardActivitySection } from '../../components/dashboardActivity.js';

export function refreshActivity(activityWrap, incidents, actions, audits) {
  activityWrap.replaceChildren(
    createDashboardActivitySection(
      {
        incidents: incidents || [],
        actions: actions || [],
        audits: audits || []
      },
      { showHeader: false }
    )
  );
}
