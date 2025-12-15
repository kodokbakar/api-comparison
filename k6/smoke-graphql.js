import http from "k6/http";
import { sleep } from "k6";

export const options = {
    vus: 1,
    duration: "10s",
};

export default function () {
    const payload = JSON.stringify({
        query: "query { sample { projectId taskId } }",
    });

    http.post("http://localhost:4000/api/v1/graphql", payload, {
        headers: { "content-type": "application/json" },
    });

    sleep(1);
}