import React, { Component } from 'react';
import axios from 'axios';

const axiosGithubGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_ACCESS_TOKEN}`
  }
});

const TITLE = 'GraphQL without a client';

class App extends Component {
  state = {
    path: 'facebook/react'
  };

  componentDidMount() {}

  onChange = e => this.setState({ [e.target.id]: e.target.value });

  onSubmit = e => {
    e.preventDefault();
  };

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
