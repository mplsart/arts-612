"""
Controllers for the Written section
"""

from rest.controllers import RestHandlerBase


from rest.utils import get_key_from_resource_id

from datetime import datetime
from pytz import timezone

import logging

from modules.events.internal.api import generic_search
from cal.controllers import create_resource_from_entity as create_event_resource
from controllers.written import create_resource_from_entity as create_blogpost_resource

from utils import ubercache
import json
from common.global_settings import get_global_settings


def unix_time(dt):
    """
    Create a Unix Timestamp of a date
    TODO: This is duplicated from modules.events.internal.search
    """

    if isinstance(dt, basestring):
        try:
            fmt = '%Y-%m-%d %H:%M:%S'
            dt = datetime.datetime.strptime(dt, fmt)
        except ValueError:
            # Attempt full day method
            fmt = '%Y-%m-%d'
            dt = datetime.datetime.strptime(dt, fmt)

    # Make it the epoch in central time..
    epoch = datetime.utcfromtimestamp(0) # .replace(tzinfo=timezone('UTC'))

    delta = dt - epoch
    return delta.total_seconds()


def sortfunc(event):
    target_ed = getattr(event, 'target_ed', None)

    sort_attr = 'end'
    if target_ed == 'timed':
        sort_attr = 'start'

    for ed in event.event_dates:
        if ed.end and ed.type == target_ed and ed.end < datetime.now():
            logging.error(unix_time(getattr(ed, sort_attr, None)))
            return unix_time(getattr(ed, sort_attr, None))
    return 14252616000000


class HomeApiHandler(RestHandlerBase):
    """
    Rest resources for homepage
    """

    def _get(self):

        limit = 30

        # Upcoming
        today = datetime.now(timezone('US/Central'))
        today = today.replace(hour=3, minute=0, second=0)
        upcoming_end = today

        upcoming = generic_search(end=upcoming_end, sort='start', limit=limit,
                                  category=[u'performance', u'reception', u'sale'])
        for e in upcoming:
            setattr(e, 'target_ed', 'timed')

        # Ongoing - sorted by ending date
        today = datetime.now().replace(hour=0, minute=0, second=0, tzinfo=timezone('US/Central'))
        end = start = today

        ongoing = generic_search(end=end, start=start, sort='end', category=[u'ongoing'],
                                 limit=limit)
        for e in ongoing:
            setattr(e, 'target_ed', 'reoccurring')

        if not upcoming:
            upcoming = []
        if not ongoing:
            ongoing = []

        upcoming.extend(ongoing)

        results = sorted(upcoming, key=sortfunc)

        return_results = []
        for r in results:
            return_results.append(create_event_resource(r))

        self.serve_success(return_results)


class FeaturedApiHandler(RestHandlerBase):
    """
    Temporary API Handler for featured content
    """

    def get(self):

        # Serialize the params for cache key
        cache_key = 'super_featured-resourcesx'

        cached_events = ubercache.cache_get(cache_key)
        if cached_events:
            results = cached_events
        else:
            gs = get_global_settings()
            resource_ids = json.loads(gs.FEATURED_HEADER_RESOURCES)

            results = []

            for resource_id in resource_ids:
                key = get_key_from_resource_id(resource_id)
                entity = key.get()

                if entity:
                    resource = None
                    kind = entity.key.kind()
                    if kind == 'Event':
                        resource = create_event_resource(entity)
                    if kind == 'BlogPost':
                        resource = create_blogpost_resource(entity)

                    if resource:
                        results.append(resource)

            ubercache.cache_set(cache_key, results, category='events')

        # Finally...
        self.serve_success(results)
