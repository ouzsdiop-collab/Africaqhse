import * as notificationsService from '../services/notifications.service.js';

export async function getAll(req, res, next) {
  try {
    const items = await notificationsService.getNotificationsFeed(
      req.qhseUser ?? null
    );
    res.json(items);
  } catch (err) {
    next(err);
  }
}
