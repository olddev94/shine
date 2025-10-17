const fetch = require('node-fetch')
const fs = require('fs')
const emailRegex = require('email-regex-safe')
const nodemailer = require('./../node_modules/nodemailer')

async function callClaude(prompt) {
    const API_KEY = process.env.CLAUDE_API_KEY
    if (!API_KEY) {
        throw new Error('CLAUDE_API_KEY environment variable is required')
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API call failed: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.content[0].text
}

async function getJobDescription(url) {
    try {
        const data = await (await fetch(url)).text()
        const prompt = getPrompt('get_description').replace('{job_description}', data)
        const response = (await callClaude(prompt)).replace('```json', '').replace('```', '')
        const json = JSON.parse(response)
        return json
    } catch (e) {
        throw Error(`Error getting job description: ${e.message}`)
    }
}
async function getJobDescriptionManual() {
    try {
        const data = fs.readFileSync('data/job/job_description.txt', 'utf8')
        const prompt = getPrompt('get_description').replace('{job_description}', data)
        const response = (await callClaude(prompt)).replace('```json', '').replace('```', '')
        const json = JSON.parse(response)
        return json
    } catch (e) {
        throw Error(`Error getting job description: ${e.message}`)
    }
}

function getResume(profileName, stack) {
    try {
        return fs.readFileSync(`data/job/resume/${profileName}/${stack}.txt`, 'utf8')
    } catch (e) {
        throw Error(`No ${stack} resume found for ${profileName} profile`)
    }
}

function getPrompt(name) {
    try {
        return fs.readFileSync(`data/job/prompt/${name}.txt`, 'utf8')
    } catch (e) {
        throw Error(`No prompt found for name: ${name}`)
    }
}

function getEmailPassword(email) {
    try {
        const credentials = JSON.parse(fs.readFileSync(`data/job/credentials.json`, 'utf8'))
        return credentials[email]
    } catch (e) {
        throw Error(`No email password found for ${email}`)
    }
}

function writeProposal(proposal) {
    fs.writeFileSync('job_proposal.txt', proposal, 'utf8')
}

function getJobProfileNames() {
    return fs.readdirSync('data/job/resume')
}

async function writeJobProposal(profileName, url) {
    try {
        const { description, stack } = await getJobDescription(url)
        console.log(`Job stack for this company: ${stack}`)
        const resume = getResume(profileName, stack)

        const prompt = getPrompt('proposal_writer').replace('{resume_content}', resume).replace('{job_description}', description)
        const proposal = await callClaude(prompt)
        writeProposal(proposal)
        console.log('Job proposal written to job_proposal.txt')
    } catch (error) {
        console.error('Error while writing job proposal:', error.message)
    }
}

async function writeJobProposalManual(profileName) {
    try {
        const { description, stack } = await getJobDescriptionManual()
        console.log(`Job stack for this company: ${stack}`)
        const resume = getResume(profileName, stack)

        const prompt = getPrompt('proposal_writer').replace('{resume_content}', resume).replace('{job_description}', description)
        const proposal = await callClaude(prompt)
        writeProposal(proposal)
        console.log('Job proposal written to job_proposal.txt')
    } catch (error) {
        console.error('Error while writing job proposal:', error.message)
    }
}

async function bidJobViaEmail(profileName, url, companyEmail) {
    try {
        const { description, stack } = await getJobDescription(url)
        console.log(`Job stack for this company: ${stack}`)
        const resume = getResume(profileName, stack)
        const name = resume.split("\n")[0]
        const myEmail = (resume.match(emailRegex()))[0]
        const myEmailPassword = getEmailPassword(myEmail)
        if (myEmail == undefined || myEmail == null)
            throw Error('Your email not found')
        if (myEmailPassword == undefined || myEmailPassword == null)
            throw Error('Your email password not found')
        if (companyEmail == undefined || companyEmail == null)
            throw Error('Company email not found')
        console.log(`Your email: ${myEmail}`)
        console.log(`Company email: ${companyEmail}`)

        const prompt = getPrompt('proposal_writer').replace('{resume_content}', resume).replace('{job_description}', description)
        const proposal = await callClaude(prompt)

        const response = await fetch('https://mailsend-fei2.onrender.com/api/mailsender', {
            method: 'POST',
            body: JSON.stringify({
                user: myEmail,
                pass: myEmailPassword,
                from: myEmail,
                to: companyEmail,
                subject: `Job Proposal: ${name} - Software Engineer`,
                text: proposal
            })
        })
        console.log("######", response)
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error while bidding job via email:', error.message)
    }
}

module.exports = {
    getJobProfileNames,
    writeJobProposal,
    writeJobProposalManual,
    bidJobViaEmail,
}