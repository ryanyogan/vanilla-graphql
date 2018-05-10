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
// 5. Now we are back to a constant, notice the $org: String!, this says the
// first argument we pass in, we want to call it "$org", it is of a Type String
// and it is required (client side validation for free!) with the "!"
// String!  says give me a string, and I mean it, not an option!
// How do we populate this?  Let's take a peek at the getIssuesOfRepository
// function call, hint "variables"
// 6. states: [OPEN], this is not GraphQL voodoo, you may create simple Enum's (Structs)
// to define particular states.  In this instance, an issue may be OPEN, CLOSED
// In english "Dear GraphQL Server, may I have the last 3 reactions (stars)
// for each of the last 5 issues that are open,
// belonging to this repository, within this organization?"
// 7. totalCount gives the int count of all issues, we will not be talking about
// cursors here, they are a bit advanced, we will go over this in the real class :-]
const GET_ISSUES_OF_REPO = `
  query($org: String!, $repo: String!, $cursor: String) {
    organization(login: $org) {
      name
      url
      repository(name: $repo) {
        id
        name
        url
        stargazers {
          totalCount
        }
        viewerHasStarred
        issues(first: 5, after: $cursor, states: [OPEN]) {
          edges {
            node {
              id
              title
              url
              reactions(last: 3) {
                edges {
                  node {
                    id
                    content
                  }
                }
              }
            }
          }
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  }
`;

const ADD_STAR = `
  mutation($repoId: ID!) {
    addStar(input: { starrableId: $repoId }) {
      starrable {
        viewerHasStarred
      }
    }
  }
`;

// Notice how we are not cluttering up the App component
// with these GraphQL helpers, normally we would import these from
// higher order helper methods (or use Apollo :))
const getIssuesOfRepository = (path, cursor) => {
  const [org, repo] = path.split('/');

  return axiosGithubGraphQL.post('', {
    query: GET_ISSUES_OF_REPO,
    variables: { org, repo, cursor }
  });
};

// This helper function marshalls our results into a form we prefer,
// in this particular instance we are calling this function from within
// setState, thus, we return an object from this function that matches
// our App component state structure

// Woh! WTF happened to this function?
// Omitting the talk of the cursor, we need to merge our new results
// with our current state... Explination on advanced course,
// notice the currying, mmm, isn't that delicious :)
const resolveIssuesQuery = (queryResult, cursor) => state => {
  const { data, errors } = queryResult.data;

  if (!cursor) {
    return {
      organization: data.organization,
      errors
    };
  }

  const { edges: oldIssues } = state.organization.repository.issues;
  const { edges: newIssues } = data.organization.repository.issues;
  const updatedIssues = [...oldIssues, ...newIssues];

  return {
    organization: {
      ...data.organization,
      repository: {
        ...data.organization.repository,
        issues: {
          ...data.organization.repository.issues,
          edges: updatedIssues
        }
      }
    },
    errors
  };
};

const addStarToRepository = repoId =>
  axiosGithubGraphQL.post('', {
    query: ADD_STAR,
    variables: { repoId }
  });

const resolveAddStarMutation = mutationResult => state => {
  const { viewerHasStarred } = mutationResult.data.data.addStar.starrable;
  const { totalCount } = state.organization.repository.stargazers;

  return {
    ...state,
    organization: {
      ...state.organization,
      repository: {
        ...state.organization.repository,
        viewerHasStarred,
        stargazers: {
          totalCount: totalCount + 1 // This is ad-hoc optimistic ui ;) seriously...
        }
      }
    }
  };
};

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

  onFetchFromGithub = (path, cursor) =>
    getIssuesOfRepository(path, cursor).then(queryResult =>
      this.setState(resolveIssuesQuery(queryResult, cursor))
    );

  // Thre we go!  This is a good place to fetch more issues, we will then
  // re-render due to setState, pass the data down, turtles in a half shell!
  onFetchMoreIssues = () => {
    const { endCursor } = this.state.organization.repository.issues.pageInfo;

    this.onFetchFromGithub(this.state.path, endCursor);
  };

  onStarRepository = (repoId, viewerHasStarred) => {
    addStarToRepository(repoId).then(mutationResult =>
      this.setState(resolveAddStarMutation(mutationResult))
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
        {/* See how we continue to pass down onFetchMoreIssues, pretty nifty eh? */}
        {organization ? (
          <Organization
            organization={organization}
            errors={errors}
            onFetchMoreIssues={this.onFetchMoreIssues}
            onStarRepository={this.onStarRepository}
          />
        ) : (
          <p>No Information Yet ...</p>
        )}
      </div>
    );
  }
}

// Small stateless component, normally this would be in ./src/components/Organization

// Nope, Organization could give 2 shits about fetching more issues, thus
// data down, actions up, let's have the App component deal with this problem.
const Organization = ({
  organization,
  errors,
  onFetchMoreIssues,
  onStarRepository
}) => {
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
      {/* There we go, let us pass in onFetchMoreIssues, App is going to handle it */}
      <Repository
        repo={organization.repository}
        onFetchMoreIssues={onFetchMoreIssues}
        onStarRepository={onStarRepository}
      />
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

// Repository does not give a shit how issues are fetched, it simply displays them
// lets see if the prop makes sense in the parent Organization component?
const Repository = ({ repo, onFetchMoreIssues, onStarRepository }) => (
  <div>
    <p>
      <strong>In Repository: </strong>
      <a href={repo.url}>{repo.name}</a>
    </p>

    <button
      type="button"
      onClick={() => onStarRepository(repo.id, repo.viewerHasStarred)}
    >
      {repo.stargazers.totalCount}
      {repo.viewerHasStarred ? ' Unstar' : ' Star'}
    </button>

    <ul>
      {repo.issues.edges.map(({ node }) => (
        <li key={node.id}>
          <a href={node.url}>{node.title}</a>

          <ReactionList reactions={node.reactions} />
        </li>
      ))}
    </ul>

    <hr />

    {repo.issues.pageInfo.hasNextPage && (
      <button onClick={onFetchMoreIssues}>Gimme More Issues!</button>
    )}
  </div>
);

// Turtles all the way down the graph!  We create another
// small concern component that matches the nested
// graph structure, so easy to reason about!
const ReactionList = ({ reactions }) => (
  <ul>
    {reactions.edges.map(reaction => (
      <li key={reaction.node.id}>{reaction.node.content}</li>
    ))}
  </ul>
);

export default App;
