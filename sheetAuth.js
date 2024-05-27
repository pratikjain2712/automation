
const jwt = require("jsonwebtoken");

const GOOGLE_SHEETS_SUBSCRIBERS_ID = '1sdERmtt3I6QDV3Xtw1NzJswQ0MhrbiGg6mf5mTiYlSU';
const GOOGLE_SHEETS_SUBSCRIBERS_PAGE = 'May';
const GOOGLE_SHEETS_SERVICE_ACCOUNT = '115083737441987478188';
const GOOGLE_SHEETS_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDIXgWfuj8QZ/91\nnMbdG0XMBkTYUy6/uHcZBHFB8TZpVirfHSgzQQoqJCim8Z6Gpc/4vmPKZT+Kl7XQ\nKN7QKTxNIt5OyuySpMoV/VScYDoAr8rsUcotGHUn0F7CwtAWnosmeuJskFbgLnOi\n84IlYCpQ7qZOHmQVdZZ3Yrsa1u6o50tW1TlNGcqR64EdkHTmXrSGSiTKCCObA907\nVbYkANws3neQM3p23tgHbZ+udEDKX4LcPRap9JYpzEKlOnqnzqg9zk9rquTUb2gD\nq3fr82lUC6Z6/ruWmJjdpONAKKJaEa2sHr6cqsPvh1ZkUj5IlfCNFD8DhyfrrhIt\ng/HGQNLhAgMBAAECggEABqdiADqLkLklAf47mdwwGK+0NWCYujPnyFREeJWQ1aSc\nVlNRLzV7WuYKCUugFLSvIxKkC+wa5jAJXc1SdGAUUbwdmK+FU57SU1TRPamlEVPn\nS4igMkLY1JwDAIYlMpIIRuDCJjy7YytXvJmdgNhxdsVxStspcaCXVknP5h0b/Cx6\nUCKlQERTW2DnJN0WU/jk/HY6dhr0SpuaYPH4vPl46sxnZRZgFC/yXIdX2B+b720G\ndUIdpZmcTNfnBy7Rdte7Ylv+L0cZj9RkBwNMqaas0TBZ/3HmfXqc3JlVc9U2F8Iw\nqkxTspC2whgoXQrCLDhWJZksXJGKLfWLYXiV/I/vCwKBgQDniTYBUcM0IeqHbnxS\nEgZ6yvoX6j8XyfalY4QfJ1g2h75HNGBozfjybeRivYqx1HTSniiPdfSWw6+l9G3p\nDtVCcMEJ4ESEXxocU3iwHBTm5L22uWiuE2R30sI6/KsR5GASSbiisFBFL4pP/7QH\n/wS9ZHkvQNlNLSwN5YT2QA199wKBgQDdibt9cnJHORGa7GThWuZS+MdwcA+nfSwb\nz4spFRe3MMs5Ppb8K3QTNOvPFsgzRh6hb2eEeOk5mTFrdiAHDo8LNZ0GzTvYkWWT\njt8UcLBJJpBCoQDsvXXLqtPcj4pvAZT/Sl1XqcJrgVKTiLQWyA76hlwuyR35mxNj\nNWEqwvbf5wKBgB6QKzPTYiwgif/kor6GqJpO7uJ3RmrSex9r2oXuQKO6GXD2xf8v\nqTv/K5WpJYTB4cXnoL0HOgkovafvcw6/qYECt0ihdQnwL9crYZQFsPClozFaminY\nX3u9s2vr7H0JI3Fmj9vR4FaxptVWkKI5lJuXhrOpIMYiP116Panv3JgTAoGBAMbb\n95ynusUMCS2TvQo82jrobb4UGTkzNwDP0A7UjDE4b3O3Jzi8mLkU7Ac8YAEGlEA9\nDCLxlgjJ5n6bziwHeYeKXKXaXDoOaauGt+BVNyiyoRPuCjJ37uEfOoXlo1H5jZGL\nYzZpf8eYklM0htNcSXXAXcbxaSLBfSm0pMAJuilJAoGAMKsO0XMiJHRui+3UU6F0\nbjF2rCZBT+HycJdB6THHiRRijTyICnhY6xCufDv7/6vkDrE+Jd7TaLTsW36X9SPV\n6iN7VKhAG0Qx1AgS22148Sqw1WG23YxYzJzma3lviEQPggX768UZc+JnaM0i4DLq\nG3vPtpahITEsIIHUspScKZA=\n-----END PRIVATE KEY-----\n";

async function getGoogleSheetsAccessToken() {
    const iat = Math.floor(Date.now() / 1000)
    const exp = iat + 3600
    const jwtToken = jwt.sign(
        {
            iss: GOOGLE_SHEETS_SERVICE_ACCOUNT,
            scope: "https://www.googleapis.com/auth/spreadsheets",
            aud: "https://accounts.google.com/o/oauth2/token",
            exp,
            iat,
        },
        GOOGLE_SHEETS_PRIVATE_KEY,
        { algorithm: "RS256" },
    )
    const { access_token } = await fetch(
        "https://accounts.google.com/o/oauth2/token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type:
                    "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: jwtToken,
            }),
        },
    ).then((response) => response.json())
    return access_token
}

const getValue = (input) => {
    if (input === "") {
        return "";
    } else if (input.includes("Neurol-India")) {
        return "NI";
    } else if (input.includes("SMJ")) {
        return "SGMJ";
    } else {
        const index = input.indexOf("_");
        return input.slice(0, index).toUpperCase();
    }
}

export async function appendDataToGoogleSheet(values) {
    console.log("Appending data to Google Sheets...");
    console.log(`Values: ${JSON.stringify(values)}`)

    const accessToken = await getGoogleSheetsAccessToken();
    const range = GOOGLE_SHEETS_SUBSCRIBERS_PAGE;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: '2-digit', year: 'numeric' });
    currentDate.setDate(currentDate.getDate() + 3);
    const threeDaysLater = currentDate.toLocaleDateString('en-US', { month: 'numeric', day: '2-digit', year: 'numeric' });
    await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_SUBSCRIBERS_ID}/values/${GOOGLE_SHEETS_SUBSCRIBERS_PAGE}:append?valueInputOption=USER_ENTERED`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                range,
                values: [[
                    getValue(values),
                    values,
                    formattedDate,
                    threeDaysLater,
                    'Subrata',
                    formattedDate
                ]]
            }),
        },
    )
}