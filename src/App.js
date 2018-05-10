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
const GET_REPO_OF_ORG = `
  {
    organization(login: "facebook") {
      name
      url
      repository(name: "react") {
        name
        url
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
    this.onFetchFromGithub();
  }

  onChange = e => this.setState({ [e.target.id]: e.target.value });

  onSubmit = e => {
    e.preventDefault();
  };

  onFetchFromGithub = () =>
    axiosGithubGraphQL.post('', { query: GET_REPO_OF_ORG }).then(res =>
      this.setState({
        organization: res.data.data.organization,
        errors: res.data.errors
      })
    );

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
const Repository = ({ repo }) => (
  <div>
    <p>
      <strong>In Repository: </strong>
      <a href={repo.url}>{repo.name}</a>
    </p>
  </div>
);

export default App;
