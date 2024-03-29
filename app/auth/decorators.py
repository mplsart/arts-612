### Decorators

from google.appengine.api import users

def login_required(handler_method):
    """
    A decorator to require that a user be logged in to access a handler.

    To use it, decorate your get() method like this::

        @login_required
        def get(self):
            user = users.get_current_user(self)
            self.response.out.write('Hello, ' + user.nickname())

    We will redirect to a login page if the user is not logged in. We always
    redirect to the request URI, and Google Accounts only redirects back as
    a GET request, so this should not be used for POSTs.
    """

    def check_login(self, *args, **kwargs):
        if self.request.method != 'GET':
            self.abort(400, detail='The login_required decorator '
                'can only be used for GET requests.')

        self._user = users.get_current_user()
        if not self._user:
            return self.redirect(users.create_login_url(self.request.url))
        else:
            handler_method(self, *args, **kwargs)

    return check_login

def rest_login_required(handler_method):
    """
    Throws a 401 instead of trying to redirect.
    """

    def check_login(self, *args, **kwargs):

        self._user = users.get_current_user()
        if not self._user:
            raise Exception('You are not authorized...')
        else:
            handler_method(self, *args, **kwargs)

    return check_login