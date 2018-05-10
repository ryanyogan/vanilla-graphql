import React, { Component } from 'react';
import axios from 'axios';

// Normally one file would not contain all of this :)

// Showing off a little about scope, we will be using scope heavily in
// the real app, here we show the "Class" is not a true Class in the OOP
// sense, it is simply a closure, has access to outer scope :)
const TITLE = 'GraphQL without a client';

const axiosGithubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}`
  }
});

// 1. Here we are creating a raw template string that contains a
// gql query for retreiving an organization from Github
// 2. Now we are also asking for a nested resource, "repository"
// How cool is that?!
// 3. Let's grab the "last: 5" issues from the repo now!
// Why edges / node?  This is the Relay way, Github chose this
// to support both Apollo and Relay (two popular GraphQL clients)
// we will be spending a lot of time with Apollo later, Relay is
// slowly dying off, AWS, and other large orgs adopted Apollo from the MDG
// (Meteor Team)
// 4. We are going to start off with a simple function, passing arguments
// into the template string, then step 5 we will switch to GraphQL variables
const getIssuesOfRepositoryQuery = (org, repo) => `
  {
    organization(login: "${org}") {
      name
      url
      repository(name: "${repo}") {
        name
        url
        issues(last: 5) {
          edges {
            node {
              id
              title
              url
            }
          }
        }
      }
    }
  }
`;

class App extends Component {
  state = {
    path: 'facebook/react',
    organization: null,
    errors: null
  };

  componentDidMount() {
    // The component mounted (this fires once), let's
    // execute the GraphQL Query
    this.onFetchFromGithub(this.state.path);
  }

  onChange = e => this.setState({ [e.target.id]: e.target.value });

  onSubmit = e => {
    this.onFetchFromGithub(this.state.path);

    e.preventDefault();
  };

  onFetchFromGithub = path => {
    const [org, repo] = path.split('/');

    axiosGithubGraphQL
      .post('', { query: getIssuesOfRepositoryQuery(org, repo) })
      .then(res =>
        this.setState({
          organization: res.data.data.organization,
          errors: res.data.errors
        })
      );
  };

  render() {
    const { path, organization, errors } = this.state;

    return (
      <div>
        <h1>{TITLE}</h1>

        <form onSubmit={this.onSubmit}>
          <label htmlFor="url">Show open issues for http://github.com/</label>
          <input
            id="url"
            type="text"
            value={path}
            onChange={this.onChange}
            style={{ width: '300px' }}
          />
          <button type="submit">Search</button>
        </form>

        <hr />

        {/* Does organization exist? If so render the component, if not wait */}
        {organization ? (
          <Organization organization={organization} errors={errors} />
        ) : (
          <p>No Information Yet ...</p>
        )}
      </div>
    );
  }
}

// Small stateless component, normally this would be in ./src/components/Organization
const Organization = ({ organization, errors }) => {
  // Did we receive an error from the Query?
  if (errors) {
    return (
      <p>
        <strong>Something went wrong :(</strong>
        {errors.map(err => err.message).join(' ')}
      </p>
    );
  }

  return (
    <div>
      <p>
        <strong>Issues from Organization: </strong>
        <a href={organization.url}>{organization.name}</a>
      </p>
      {/* Here we now include the Repository component to clean up concerns */}
      <Repository repo={organization.repository} />
    </div>
  );
};

// Repository is another stateless component which renders a repo link
// Have you noticed something cool? We are creating components that match
// the graph structure defined by Github ... Organization -> Repository -> Issues

// Woh... wait a minute buddy, what is this node nonsense again?
// Well we could do `map(issue => console.log(issue.node.id))`
// As you can see, each "edge", has a node, as this is a Graph behind
// the scenes, so in this case, I was able to destructure ({ node })
// don't worry if this is weird, strange, stupid, it will make sense
// over time :)
const Repository = ({ repo }) => (
  <div>
    <p>
      <strong>In Repository: </strong>
      <a href={repo.url}>{repo.name}</a>
    </p>

    <ul>
      {repo.issues.edges.map(({ node }) => (
        <li key={node.id}>
          <a href={node.url}>{node.title}</a>
        </li>
      ))}
    </ul>
  </div>
);

export default App;
