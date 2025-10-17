require('dotenv').config()
const readline = require('readline')
const { getJobProfileNames, writeJobProposal, writeJobProposalManual, bidJobViaEmail } = require('./utils/index.js')



const jobProfileNames = getJobProfileNames()

console.log(`Available Job Profiles: ${jobProfileNames}`)
console.log(`1. Job Proposal Writer - {profileName}, {url}`)
if (jobProfileNames.length == 1)
    console.log(`2. Job Proposal Writer for ${jobProfileNames[0]} - {url}`)
console.log(`3. Job Proposal Writer (job_description.txt) - {profileName}`)
if (jobProfileNames.length == 1)
    console.log(`4. Job Proposal Writer (job_description.txt) - ${jobProfileNames[0]}`)

// console.log(`5. Job Bid via email - {profileName}, {url}, {company email}`)
// if (jobProfileNames.length == 1)
//     console.log(`6. Job Bid via email for ${jobProfileNames[0]} - {url}, {company email}`)
// console.log(`7. Job Bid via email (job_description.txt) - {profileName} {company email}`)
// if (jobProfileNames.length == 1)
//     console.log(`8. Job Bid via email for ${jobProfileNames[0]} - {company email}`)




const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.question('Select mode: ', (mode) => {
    try {
        mode = parseInt(mode)
        switch (mode) {
            case 1:
                rl.question('Enter profile name: ', (profileName) => {
                    rl.question('Enter job URL: ', (url) => {
                        writeJobProposal(profileName, url)
                        rl.close()
                    })
                })
                break
            case 2:
                rl.question('Enter job URL: ', (url) => {
                    writeJobProposal(jobProfileNames[0], url)
                    rl.close()
                })
                break
            case 3:
                rl.question('Enter profile name: ', (profileName) => {
                    writeJobProposalManual(profileName)
                    rl.close()
                })
                break
            case 4:
                writeJobProposalManual(jobProfileNames[0])
                rl.close()
                break
            case 5:
                rl.question('Enter profile name: ', (profileName) => {
                    rl.question('Enter job URL: ', (url) => {
                        rl.question('Enter company email: ', (email) => {
                            bidJobViaEmail(profileName, url, email)
                            rl.close()
                        })
                    })
                })
                break
            case 6:
                rl.question('Enter job URL: ', (url) => {
                    rl.question('Enter company email: ', (email) => {
                        bidJobViaEmail(jobProfileNames[0], url, email)
                        rl.close()
                    })
                })
                break
        }
    } catch (e) {
        console.error('Error:', e.message)
    }
})
