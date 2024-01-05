const core = require("@actions/core")
const github = require("@actions/github")
const http = require("@actions/http-client")

const token = core.getInput("repo-token")

const octokit = github.getOctokit(token)

const run = async () => {
  console.log(github.context)

  try {
    let regExp = RegExp(/[Vv](\d)+\.(\d)+\.(\d)+/)
    var tagsRequest = await octokit.rest.repos.listTags({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
    })

    orderedTags = tagsRequest.data
      .filter((tag) => regExp.test(tag.name))
      .map((tag) => tag.name.toLocaleLowerCase())
      .sort((version1, version2) => compareSemanticVersions(version1, version2))
      .reverse()

    nextVersionTag = getNextVersion(orderedTags[0])
    console.log(`last version is ${orderedTags[0]}`)
    console.log(`next version is ${nextVersionTag}`)

    core.setOutput("last", orderedTags[0] || "")
    core.setOutput("next", nextVersionTag)
  } catch (e) {
    console.log("FAIL", e)
  }
}

const compareSemanticVersions = (version1, version2) => {
  const parts1 = version1.split(".").map(Number)
  const parts2 = version2.split(".").map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0

    if (num1 !== num2) {
      return num1 > num2 ? 1 : -1
    }
  }

  return 0
}

const getNextVersion = (version, strategy) => {
  if (!version) return "v0.0.1"

  switch (strategy) {
    case "major":
      let splitMajor = version.split(".")
      splitMajor[0] = `v${parseInt(splitMajor[0].substring(1)) + 1}`
      return splitMajor.join(".")
    case "minor":
      let splitMinor = version.split(".")
      splitMinor[1] = parseInt(splitMinor[1]) + 1
      return splitMinor.join(".")
    case "patch":
    default:
      let splitPatch = version.split(".")
      splitPatch[2] = parseInt(splitPatch[2]) + 1
      return splitPatch.join(".")
  }
}

run()
