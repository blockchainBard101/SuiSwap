const query = `
  query {
    transactionBlocks(first: 1) {
      nodes {
        balanceChanges {
          nodes {
            owner {
              address
            }
            coinType {
              repr
            }
            amount
          }
        }
      }
    }
  }
`;

fetch('https://sui-mainnet.mystenlabs.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
}).then(r => r.json()).then(data => {
    console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
