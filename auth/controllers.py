"""
Signup and Authentication routes
"""

import webapp2
from google.appengine.api import users
from auth.decorators import login_required
import logging
import jinja2
import os

from auth import mailinglist

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)


from HTMLParser import HTMLParser

class MLStripper(HTMLParser):
    def __init__(self):
        self.reset()
        self.fed = []
    def handle_data(self, d):
        self.fed.append(d)
    def get_data(self):
        return ''.join(self.fed)

def strip_tags(html):
    s = MLStripper()
    s.feed(html)
    return s.get_data()

class LogoutHandler(webapp2.RequestHandler):
    
    @login_required
    def get(self):
        self.response.write('Hello, %s! (<a href="%s">Click here to continue logging out.</a>)<br /><br />' %
                    (self._user.nickname(), users.create_logout_url('/')))
    
class SignupHandler(webapp2.RequestHandler):
    def get(self):

        # Super simple validation
        email = self.request.get('email', None)
        error = False
        
        if not email:
            error = 'Please Enter Your Email Address'

        if not error:
            # Validate the email "looks" like an email
            import re
            result = re.match("^[^@]+@[^@]+\.[^@]+$", email)
            if not result:
                error = 'Please Enter A Valid Email Address'

        if not error:
            cleaned_email = strip_tags(email)
            if not cleaned_email == email:
                error = 'Email Addresses May Not Contain HTML Tags'


        if not error:
            try:
                result = mailinglist.create_record(email, self.request.remote_addr)
            except Exception, e:
                error = 'There was an issue. Please Try again in a few minutes.'
                logging.exception(e)

        if error:
            template = 'signup.html'
        else:
            template = 'thankyou.html'

        template_values = {'error': error, 'email': email}
        template = JINJA_ENVIRONMENT.get_template(template)
        self.response.write(template.render(template_values))
        
        

class ActivateHandler(webapp2.RequestHandler):
    def get(self):
        self.response.write('Activation Handler')



class BaseHandler(webapp2.RequestHandler):
    """
    """
    
    _user = None

    def handle_exception(self, exception, debug):
        # Log the error.
        logging.exception(exception)

        # Set a custom message.
        self.response.write('An error occurred.')

        # If the exception is a HTTPException, use its error code.
        # Otherwise use a generic 500 error code.
        if isinstance(exception, webapp2.HTTPException):
            self.response.set_status(exception.code)
        else:
            self.response.set_status(500)
            self.response.write('<br />Message:')
            self.response.write(exception)



class ProfileHandler(BaseHandler):
    @login_required
    def get(self):

        # This should be rendered by the template context
        self.response.write('Welcome, %s! (<a href="%s">sign out</a>)<br /><br />' %
                    (self._user.nickname(), users.create_logout_url('/')))

        self.response.write('This is some secure stuff')


class ConfirmHandler(webapp2.RequestHandler):
    def get(self):

        user = users.get_current_user()
        if user:
            greeting = ('Welcome, %s! (<a href="%s">sign out</a>)' %
                        (user.nickname(), users.create_logout_url('/')))
        else:
            greeting = ('<a href="%s">Sign in or register</a>.' %
                        users.create_login_url('/beta/confirm/'))

        self.response.out.write('<html><body>%s</body></html>' % greeting)