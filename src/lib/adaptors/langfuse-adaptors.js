const { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST } = require("@/constants");
const { Langfuse } = require("langfuse");

const langfuse = new Langfuse({
    publicKey: LANGFUSE_PUBLIC_KEY,
    secretKey: LANGFUSE_SECRET_KEY,
    baseUrl: LANGFUSE_HOST, // cloud or local
});

const getAllTraces = async () => {
    const traces = await langfuse.fetchTraces({
        limit: 100,
    });
    return traces;
}

module.exports = { getAllTraces }