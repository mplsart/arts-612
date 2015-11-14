var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var NotFoundRoute = Router.NotFoundRoute;
var App = require('./components/layout');

//var CalendarPage = require('./components/pages/CalendarPage');
var EventPage = require('./components/pages/EventPage').EventPage;
var GalleryPages = require('./components/pages/GalleryPages');
var NewHomePage = require('./components/pages/NewHomePage');
var AboutPage = require('./components/pages/AboutPage');
var WrittenPages = require('./components/pages/Written');
var Error404Page = require('./components/pages/Error404Page');


var routes = (
    <Route name="app" path="/" handler={App}>
        <Route name="aboutxxx" path="about/?" handler={AboutPage} />
        <Route name="eventsxxx" path="events/:slug/?" handler={EventPage} />

        <Route name="galleriesxxxy" path="galleries/?" handler={GalleryPages.GalleryPage} />
        <Route name="galleriesxxx" path="galleries/:slug/?" handler={GalleryPages.GalleryViewPage} />

        <Route name="written_index_page" path="written/?" handler={WrittenPages.WrittenPage} />
        <Route name="written_category_page" path="written/:category_slug/?" handler={WrittenPages.WrittenCategoryPage} />
        <Route name="written_view_page" path="written/:year/:month/:slug/?" handler={WrittenPages.WrittenArticlePage} />


        <DefaultRoute handler={NewHomePage} />
        <NotFoundRoute handler={Error404Page}/>
    </Route>
);


exports.start = function() {
  global.router = Router.run(routes, Router.HistoryLocation, function (Handler, state) {
        React.render(<Handler />, document.getElementById('main_content'));
    });
}



/*
ReactRouter.createRoute('/', function () {
    React.unmountComponentAtNode(document.getElementById('main_content'));
    React.render(<NewHomePage />, document.getElementById('main_content'));
});


ReactRouter.createRoute('/home', function () {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<HomePage />, document.getElementById('main_content'));
});

ReactRouter.createRoute('/about/', function () {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<AboutPage />, document.getElementById('main_content'));
});


ReactRouter.createRoute('/events/{slug}/', function (params) {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<EventPage slug={params.slug} />, document.getElementById('main_content'));
});

ReactRouter.createRoute('/calendar/', function () {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<CalendarPage/>, document.getElementById('main_content'));
});

ReactRouter.createRoute('/galleries/', function () {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<GalleryPage />, document.getElementById('main_content'));
});

ReactRouter.createRoute('/galleries/{slug}/', function (params) {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<GalleryViewPage slug={params.slug} />, document.getElementById('main_content'));
});

ReactRouter.createRoute('/written/', function () {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<WrittenPage />, document.getElementById('main_content'));
});


ReactRouter.createRoute('/written/{category_slug}/', function (params) {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<WrittenCategoryPage category_slug={params.category_slug} />, document.getElementById('main_content'));
});


ReactRouter.createRoute('/written/{category_slug}/{slug}/', function (params) {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<WrittenArticlePage category_slug={params.category_slug} slug={params.slug} />, document.getElementById('main_content'));
});





ReactRouter.createRoute('/written/{year}/{month}/{slug}/', function (params) {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<WrittenArticlePage year={params.year} month={params.month} slug={params.slug} />, document.getElementById('main_content'));
});

ReactRouter.createRoute('*', function () {
    React.unmountComponentAtNode( document.getElementById('main_content'));
    React.render(<Error404Page />, document.getElementById('main_content'));
});
*/