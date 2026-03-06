import { SuiGraphQLClient } from '@mysten/sui/graphql';

const client = new SuiGraphQLClient({
    url: 'https://sui-testnet.mystenlabs.com/graphql',
});

const query = `
query {
  transactionBlocks(last: 5) {
    nodes {
      digest
      sender {
        address
      }
    }
  }
}
`;

async function main() {
    const result = await client.query({ query });
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
