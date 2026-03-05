const owner = "0xef3abbbefa31257f4437418a7fdfa8c101abab63bd873b9c5379236980491c03";
const query = `
  query GetUserTxs($owner: SuiAddress!) {
    transactionBlocks(
      first: 5
      filter: { signAddress: $owner }
    ) {
      nodes {
        digest
      }
    }
  }
`;

fetch('https://fullnode.testnet.sui.io:443/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables: { owner } })
}).then(r => r.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
