import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http'
import { Counter } from 'k6/metrics'
import { sleep, check as loadTestingCheck } from "k6";


let failedTestCases = new Counter('failedTestCases');

export const options = {
    duration: '.5m',
    vus: 5,
    iterations: 10,
    thresholds: {
        http_req_failed: ['rate<0.01'], // http errors should be less than 1%
        http_req_duration: ['p(95)<500'], // 95 percent of response times must be below 500ms
        failedTestCases: [{ threshold: 'count==0' }]
    },
};

let check = function (obj, conditionArray, tags) {
    let result = loadTestingCheck(obj, conditionArray, tags || {});
    failedTestCases.add(!result);
    return result;
};

export default function () {
    const url = "https://core.ssikit.walt.id/v1/did/create";

    let didData = {
        "method": "key"
    }
    const url1 = 'https://signatory.ssikit.walt.id/v1/credentials/issue';

    const url2 = 'https://auditor.ssikit.walt.id/v1/verify';

    let did1 = (http.post(url, JSON.stringify(didData), {
        headers: { 'Content-Type': 'application/json' },
    }))

    let did2 = (http.post(url, JSON.stringify(didData), {
        headers: { 'Content-Type': 'application/json' },
    }))

    let data = {
        "templateId": "OpenBadgeCredential",
        "config": {
            "issuerDid": did1.body,
            "subjectDid": did2.body
        }
    }

    let res = http.post(url1, JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
    })

    let auditorData = {
        "policies":
            [
                {
                    "policy": "SignaturePolicy"
                },
                {
                    "policy": "JsonSchemaPolicy"
                }
            ],
        "credentials":
            [
                res.body
            ]
    }

    let auditRes = http.post(url2, JSON.stringify(auditorData), {
        headers: { 'Content-Type': 'application/json' },
    })


    check(did1.status, {
        "Creating did API is working": (status) => status === 200
    });

    check(res.status, {
        "Issuing OBC credential API is working": (status) => status === 200
    });


    check(res.json('issuer.id'), {
        "credential creator OK": (creator) => creator === did1.body
    })

    check(res.json('credentialSubject.id'), {
        "credential holder OK": (id) => id === did2.body
    })

    check(auditRes.json('valid'), {
        "valid credential": (valid) => valid === true
    })
}
export function handleSummary(data) {
    console.log('Finished executing performance tests');

    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }), // Show the text summary to stdout...
        'summary.json': JSON.stringify(data), // and a JSON with all the details...
    };
}
