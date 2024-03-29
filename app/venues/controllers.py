"""
Rest API for Venues/Galleries
"""

import logging
import voluptuous
from auth.decorators import rest_login_required


from google.appengine.ext import ndb

from rest.params import coerce_to_cursor
from rest.controllers import RestHandlerBase
from rest.resource import Resource
from rest.resource import RestField, SlugField, ResourceIdField, ResourceUrlField, GeoField
from rest.utils import get_key_from_resource_id

from files.rest_helpers import FileField

from modules.venues.internal import api as venues_api
from modules.venues.internal import search as vsearch
from modules.venues.internal.models import Venue

from framework.controllers import BaseHandler
from utils import get_domain

resource_url = 'http://' + get_domain()  + '/api/galleries/%s'

REST_RULES = [
    ResourceIdField(output_only=True),
    ResourceUrlField(resource_url, output_only=True),
    SlugField(Venue.slug, required=True),
    RestField(Venue.name, required=True),

    RestField(Venue.address, required=True),
    RestField(Venue.address2, required=False),
    RestField(Venue.city, required=True),
    RestField(Venue.state, required=True),
    RestField(Venue.country, required=True),

    RestField(Venue.website, required=False),
    RestField(Venue.phone, required=False),
    RestField(Venue.email, required=False),
    RestField(Venue.category, required=True),
    RestField(Venue.hours, required=False),
    GeoField(Venue.geo, required=False),

    RestField(Venue.content),
    RestField(Venue.summary),

    RestField(Venue.primary_image_resource_id, required=False),
    FileField('primary_image_resource', required=False, output_only=True, resource_id_prop='primary_image_resource_id'),
]


def create_resource_from_entity(e, verbose=False):
    """
    Create a Rest Resource from a datastore entity
    TODO: We don't care about verbosity just yet
    """

    return Resource(e, REST_RULES).to_dict()


class GalleryApiHandlerBase(RestHandlerBase):
    """
    Base Handler for all Gallery API endpoints
    """

    def get_rules(self):
        return REST_RULES


class GalleriesApiHandler(GalleryApiHandlerBase):
    """
    Main Handler for Galleries Endpoint
    """


    def get_param_schema(self):
        return {
            'limit' : voluptuous.Coerce(int),
            'cursor': coerce_to_cursor,
            #'sort': voluptuous.Coerce(str),
            'get_by_slug': voluptuous.Coerce(str),
            'q': voluptuous.Coerce(str)
        }

    def _get(self):

        # Check if there is a query filter, etc
        get_by_slug = self.cleaned_params.get('get_by_slug', None)

        if get_by_slug:
            venue = venues_api.get_venue_by_slug(get_by_slug)
            if not venue:
                self.serve_404('Gallery Not Found')
                return False

            resource = create_resource_from_entity(venue)
            self.serve_success(resource)
            return

        q = self.cleaned_params.get('q', None)


        if q:
            results = vsearch.simple_search(q)
            # hydrate the search results
            keys_to_fetch = []
            #raise Exception(results)

            # TODO: This should be a bulk get
            for r in results['index_results']:
                keys_to_fetch.append(venues_api.get_venue_key(r.doc_id))

            entities = ndb.get_multi(keys_to_fetch)

        else:
            entities = Venue.query().fetch(1000)


        # Create A set of results based upon this result set - iterator??
        results = []
        for e in entities:
            results.append(create_resource_from_entity(e))

        self.serve_success(results)

    @rest_login_required
    def _post(self):
        """
        Create Venue Resource

        TODO: None of the data is validated right now...
        """

        """
        # Expected payload

        {
            "slug": "supercoolgallery",
            "name": "Super Cool Gallery",
            "address": "123 Whatever St",
            "address2": "",
            "city": "Minneapolis",
            "state": "MN",
            "country": "USA",
            "geo": {
                        "lat": 45.004628,
                        "lon": -93.247606
                    },
            "website": "http://supercool.com",
            "phone": "612-555-5555",
            "email": "info@totallycool.com",
            "category": "gallery"
        }
        """

        e = venues_api.create_venue(self.cleaned_data)
        result = create_resource_from_entity(e)
        self.serve_success(result)


class GalleryDetailApiHandler(GalleryApiHandlerBase):
    """
    """

    def _get(self, slug):
        # TODO: Abstract this a bit more out into a rest-like service...

        resource_id = slug

        key = get_key_from_resource_id(resource_id) #ndb.Key(urlsafe=slug)
        e = key.get()

        #e = venues_api.get_venue_by_slug(slug)

        if not e:
            self.serve_404('Gallery Not Found')
            return False

        resource = create_resource_from_entity(e)
        self.serve_success(resource)

    @rest_login_required
    def _put(self, slug):
        """
        Edit a resource

        TODO: None of the data is validated right now...
        """

        """
        # Expected payload

        {
            "name": "Super Cool Gallery",
            "address": "123 Whatever St",
            "address2": "",
            "city": "Minneapolis",
            "state": "MN",
            "country": "USA",
            "geo": null,
            "website": "http://supercool.com",
            "phone": "612-555-5555",
            "email": "info@totallycool.com",
            "category": "gallery"
        }
        """

        resource_id = slug
        key = get_key_from_resource_id(resource_id) #ndb.Key(urlsafe=slug)
        venue = key.get()

        #venue = venues_api.get_venue_by_slug(slug)
        if not venue:
            self.serve_404('Gallery Not Found')
            return False

        if not self.cleaned_data['slug'] == key.id():
            raise Exception('Unable to edit slugs on venues at this time. Please change slug to: %s' % key.id())

        venue = venues_api.edit_venue(venue, self.cleaned_data)
        result = create_resource_from_entity(venue)
        self.serve_success(result)

    @rest_login_required
    def _delete(self, slug):
        """
        Delete a Resource
        """

        venue = venues_api.get_venue_by_slug(slug)

        if not venue:
            self.serve_404('Gallery Not Found')
            return False

        result = venues_api.delete_venue(venue, self.cleaned_data)
        self.serve_success(result)


class GalleryMainHandler(BaseHandler):
    """
    Main Handler For Gallery Listings
    """

    def get(self):
        pagemeta = {
            'title': 'Galleries and Venues',
            'description': 'A Directory of Galleries and Places that Show Art in Minneapolis',
            'image': 'http://www.soapfactory.org/img/space/gallery-one-2.jpg'}

        template_values = {'pagemeta': pagemeta}
        self.render_template('templates/index.html', template_values)


class GalleryDetailHandler(BaseHandler):
    """
    Handler for Serving up the chrome for the gallery page
    """

    def get(self, slug):
        # TODO: Abstract this a bit more out into a rest-like service...
        e = venues_api.get_venue_by_slug(slug)

        if not e:
            logging.error('Gallery Not Found with slug %s.' % slug)
            self.response.set_status(404)

        # TODO: Update these values
        pagemeta = {
                'title': 'Gallery Name',
                'description': 'Gallery Summary',
                'image': ''}

        template_values = {'pagemeta': pagemeta}
        self.render_template('templates/index.html', template_values)
