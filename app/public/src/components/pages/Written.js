var React = require('react');
var Reflux = require('reflux');

var BlogStores = require('../../modules/blog/stores');
var BlogActions = require('../../modules/blog/actions');

var PageMixin = require('./PageMixin');
var Footer = require('../temp/Footer');
var TempExtras = require('../temp/TempExtras');
var TempUpcoming = require('../calendar/TempUpcoming');
var TempEvents = require('../calendar/TempEvents');

var ArticleGoober = require('./../DataTypes/Article').ArticleGoober;
var PodArticleRenderer = require('./../DataTypes/Article').PodArticleRenderer;
var DefaultArticleRenderer = require('./../DataTypes/Article').DefaultArticleRenderer;


/* Written Landing Page Component */
var WrittenPage = React.createClass({
    mixins: [PageMixin, Reflux.ListenerMixin],

    default_meta: {
        'title': 'Written',
        'description': 'Writing and Crtique'
    },

    getInitialState: function () {
        return {
            articles: [],
        };
    },

    pageDidMount: function () {
        // Subscribe to desired actions
        this.listenTo(BlogStores.BlogPostStore, this.onRequestAll);

        // Trigger the load action to set the intial data for the page
        this.requestPageContent();
    },

    /* Flux Store Listener Callbacks */
    requestPageContent: function() {
        /* Render a fresh page based on url params.
            For now, this just means getting a new event.
            Tell the Actions you need the Event from the store */
        /* This is called pageDidMount and componentWillReceiveProps */

        // Trigger the load action
        BlogActions.BlogPostActions.requestAll();
    },

    onRequestAll: function(payload) {
        // EventStore triggered a new event coming in

        var state_venues = [];

        // payload is a map of updated venues, so we ignore if we want or not
        for (var resource_id in payload) {
            state_venues.push(payload[resource_id]);
        }

        this.setState({articles: state_venues});

    },

    loadMoreHandler: function(e) {
        e.preventDefault();
        BlogActions.BlogPostActions.requestMore();
    },

    render: function () {

        var articles = []
        var rc = this;

        if (this.state.articles != undefined) {
            articles = this.state.articles.map(function (post) {
                return <div className="card" key={ post.resource_id }><ArticleGoober key={ post.resource_id } resource={ post } renderer={ PodArticleRenderer } /></div>
            });
        }

        // if there is more, show
        var more_button;
        if (BlogStores.BlogPostStore.hasMore()) {
            more_button = <a className="btn btn-primary btn-lg btn-block" key="loadmore_button" onClick={ this.loadMoreHandler } href="#">load more...</a>
        }

        return <div id="HomePageWrapper">
            <div className="row">

                <div className="col-md-6" id="main-content-container">

                    <h2>Written</h2>

                    <div className="alert alert-warning">Our Written section is returing soon including the archives from the old site. Stay tuned and enjoy these articles.</div>

                    { articles }

                    { more_button }
                    <br />


                    <div className="row">
                        <TempExtras />
                    </div>

                </div>
                <div className="col-md-3 panel-events"><TempUpcoming col_name="'Upcoming" /></div>
                <div className="col-md-3 panel-events"><TempEvents col_name="'Now Showing'"  /></div>
            </div>

            <Footer />
        </div>;

    }
});


var WrittenArticlePage = React.createClass({
    mixins: [PageMixin, Reflux.ListenerMixin],

    // TODO: More logical defaults and match to server...
    default_meta: {
        title: 'Article',
        description: 'Article Descripton'
    },

    getInitialState: function () {
        return {
            resource_loaded: false,
            resource_not_found: false,
            resource: null
        };
    },

    /* React Life Cycle Methods */
    pageDidMount: function () {
        // Subscribe to desired actions
        this.listenTo(BlogStores.BlogPostSlugStore, this.onRequestResource);

        // Trigger the load action to set the intial data for the page
        this.requestPageContent();
    },

    componentWillReceiveProps: function() {
        /* Page was navigated to with different url params, so we need to manually request event */
        // Called on react-router transition

        this.requestPageContent();
        return true;
    },


    /* Flux Store Listener Callbacks */
    requestPageContent: function() {
        /* Render a fresh page based on url params.
            For now, this just means getting a new event.
            Tell the Actions you need the Event from the store */
        /* This is called pageDidMount and componentWillReceiveProps */

        // Trigger the load action
        var slug = this.context.router.getCurrentParams().slug;
        //VenueActions.requestResourceBySlug(slug); // Action based pattern

        BlogStores.BlogPostSlugStore.get(slug).then(function (payload) {
            // success
            this.setState({
                resource_not_found:false,
                resource_loaded: true,
                resource: payload}
            );
        }.bind(this),
        function (payload) {
            // success
            this.setState({
                resource_not_found:true,
                resource_loaded: true,
                resource: payload}
            );

        }.bind(this)

        );

    },
    onRequestResource: function(payload) {
        // Handle

        this.setState({
            resource_not_found:false,
            resource_loaded: true,
            resource: payload}
        );
    },

    set_meta_for_resource: function() {
        // Set the Page Meta for this specific post

        post = this.state.resource;

        this.default_meta =  {
            title: post.title,
            description: post.summary
        }

        if (post.primary_image_resource) {
            // TODO: Do better error checking...
            this.default_meta['image'] = post.primary_image_resource.versions.CARD_SMALL.url;
        }

        this.setMeta();
    },

    render: function() {
        var rendered_article;

        if (!this.state.resource_loaded) {
            // TODO: Render a shell of what the page will look like
            return (<div>loading article...</div>);
        }


        if (this.state.resource_not_found) {
            rendered_article = (<div>
                <h2>Article Not Found</h2>
                <p>We were unable to find this article. If you are looking for an old article, they will be returning in the next few months. </p>
            </div>);
        }
        else if (this.state != undefined) {

            if (!this.state.resource.is_published){
            rendered_article = (<div>
                <h2>Article Is Not Published</h2>
                <p>The article you are looking for is not yet published. Please check back later. </p>
            </div>);
            }
            else {
                var post = this.state.resource
                rendered_article = <ArticleGoober key={ post.resource_id } resource={ post } renderer={ DefaultArticleRenderer } />
            }
        }
        else {
            rendered_article = <ArticleGoober resource={ null } renderer={ DefaultArticleRenderer } />
        }

        return <div id="HomePageWrapper">

            <div className="row">

                <div className="col-md-6" id="main-content-container">
                    <div className="row">

                        <div className="col-xs-12">
                            { rendered_article }
                        </div>
                        <TempExtras />
                    </div>

                </div>
                <div className="col-md-3 panel-events"><TempUpcoming col_name="'Upcoming" /></div>
                <div className="col-md-3 panel-events"><TempEvents col_name="'Now Showing'"  /></div>
            </div>

            <Footer />
        </div>;

    },

});


var BlogPostService = {
    _resources_store: [],

    set_resource: function(resource_data) {

        /* TODO: Move this to the base class */
        this._resources_store.push(resource_data);
        return resource_data;
    },

    get_posts_by_category: function(category_slug) {
        var resource_url = '/api/posts?category_slug=' + category_slug + '&is_published=true';
        var service = this;

        var promise = new Promise(function(accept, reject) {
            var req = $.ajax({
                url: resource_url,
                context: this,
                dataType: 'json',
                success:  function (response) {
                    if (response.status == 200) {

                        // This should really be done by the PostsService
                        var resource = service.set_resource(response.results);
                        accept(resource);
                    }
                    else {
                        // TODO: Do this after x amount of attempts
                        reject('Received a status of ' + response.status);
                    }
                },
                error: function (xhr, status, err) {
                    reject(err);
                }
            });
        });

        return promise;

    }

}



var ResourceApiService = {
    fetch: function (url) {
        var service = this;

        var promise = new Promise(function(accept, reject) {


            var req = $.ajax({
                url: url,
                context: this,
                dataType: 'json',
                success:  function (response) {
                    if (response.status == 200) {
                        accept(response.results);
                    }
                    else {
                        reject('Received a status of ' + response.status);
                    }
                },
                error: function (xhr, status, err) {
                    reject(err);
                }
            });
        });
        return promise;

    }
};


var PostCategoriesService = {
    _resources_store: [],

    set_resource: function(resource_data) {
        /* TODO: Move this to the base class */
        this._resources_store.push(resource_data);
        return resource_data;
    },
    set_resource_multi: function(resource_data) {
        for (var i = 0; i < resource_data.length; i++) {
            this.set_resource(resource_data[i]);
        }
    },
    get_posts: function(slug) {
        /* Query Posts for this Category */
        return BlogPostService.get_posts_by_category(slug)
    },

    get_all: function() {
        var service = this;
        var promise = new Promise(function (accept, reject) {
            ResourceApiService.fetch('/api/post_categories').then(function(resource_data) {
                var resources = service.set_resource_multi(resource_data);
                accept(resources);

            }, reject);
        });
        return promise;
    },
    get_by_slug: function(slug) {
        var service = this;

        return new Promise(function(accept, reject) {
            ResourceApiService.fetch('/api/post_categories?get_by_slug=' + slug).then(function(resource_data) {
                var resource = service.set_resource(resource_data);
                accept(resource);
            }, reject);
        });
    }
}


var ListCategories = React.createClass({
    /* This is not currently in use, but used to test the get_all methods */
    componentDidMount: function() {

        var promise = PostCategoriesService.get_all().then(function(category_resources) {
            console.log(category_resources);

        });

    },
    render: function() {
        return <b>booom</b>
    }
});


var WrittenCategoryPage = React.createClass({
    mixins: [PageMixin],

    // TODO: More logical defaults and match to server...
    default_meta: {
        title: 'Browse By Category',
        description: 'Article Descripton',
        image: 'http://Default Article URL'
    },

    getInitialState: function () {
        /* TODO: This should be defaulted to empty object */

        var slug = this.context.router.getCurrentParams().category_slug;
        return {
            resource_url: '/api/posts?category_slug=' + slug,
            content_loaded: false,
            content_not_found: false,
            results: null,
            data: null
        };
    },

    set_meta_for_resource: function() {
        // Set the Page Meta for this specific post

        if (this.state.category_content_loaded) {

            this.default_meta = {
                title: this.state.category_results.title,
                description: 'View all posts filed under ' + this.state.category_results.title
            }
            this.setMeta();
        }

        /*
        post = this.state.results;

        this.default_meta =  {
            title: post.title,
            description: post.summary
        }

        if (post.primary_image_resource) {
            // TODO: Do better error checking...
            //this.default_meta['image'] = post.primary_image_resource.versions.CARD_SMALL.url;
        }

        this.setMeta();
        */
    },
    pageDidMount: function () {

        var rc = this;

        // Build a promise to fetch the requested data
        var slug = this.context.router.getCurrentParams().category_slug;

        var promise = PostCategoriesService.get_by_slug(slug).then(function(category_resource) {
            rc.setState({category_content_loaded:true, category_results:category_resource});
            rc.set_meta_for_resource();

            // Next Attempt to get all the Posts for this Category
            var promise2 = PostCategoriesService.get_posts(slug).then(
                function(posts) {
                    rc.setState({content_loaded:true, results:posts});
                },
                function(err) {
                    console.log(err);
                }
                );




        }.bind(this), function(err) {
            this.setState({content_not_found:true, content_loaded:true})
        }.bind(this)
        );

    },

    render: function() {

        var articles = []
        var rc = this;

        if (this.state.content_not_found) {
            return <div><h2>Category Not Found</h2><p>Please visit to the <a href="/written" className="internal-link">main page</a></p></div>
        }

        if (this.state.results != undefined) {
            articles = this.state.results.map(function (post) {
                return <div className="card" key={ post.resource_id }><ArticleGoober key={ post.resource_id } resource={ post } renderer={ PodArticleRenderer } /></div>
            });
        }

        var category_title = '---------'
        if (this.state.category_results) {
            category_title = this.state.category_results.title
        }

        return <div id="HomePageWrapper">

            <div className="row">

                <div className="col-md-6" id="main-content-container">
                    <div className="row">

                        <div className="col-xs-12">
                            <h2>{ category_title }</h2>
                            { articles }
                        </div>
                        <TempExtras />
                    </div>

                </div>
                <div className="col-md-3 panel-events"><TempUpcoming col_name="'Upcoming" /></div>
                <div className="col-md-3 panel-events"><TempEvents col_name="'Now Showing'"  /></div>
            </div>

            <Footer />
        </div>;

    },

});


module.exports = {
    WrittenArticlePage: WrittenArticlePage,
    WrittenPage: WrittenPage,
    WrittenCategoryPage: WrittenCategoryPage
};
