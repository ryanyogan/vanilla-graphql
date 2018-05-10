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

// Here we are creating a raw template string that contains a
// gql query for retreiving an organization from Github
const GET_ORGANIZATION = `
  {
    organization(login: "facebook") {
      name
      url
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
    axiosGithubGraphQL.post('', { query: GET_ORGANIZATION }).then(res =>
      this.setState({
        organization: res.data.data.organization,
        errors: res.data.errors
      })
    );

  render() {
    const { path } = this.state;

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

        {/* The results will be displayed here... */}
      </div>
    );
  }
}

export default App;
