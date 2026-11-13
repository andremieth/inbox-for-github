# Two repositories

This repository is the Windows edition of Inbox for GitHub: a fork of
[julian-wendt/inbox-for-github](https://github.com/julian-wendt/inbox-for-github), called
"upstream" here. Upstream is the app. This repository adds what the app needs to run on Windows,
and nothing else. The rules below keep the two from drifting apart; they were agreed with
upstream's author on 2026-11-11.

## What lives where

| | Upstream | Here |
|---|---|---|
| The app: views, behaviour, anything a Mac user would notice | yes | arrives by merge |
| Features and fixes that are not about Windows | yes, as a pull request from here | only ahead of time, as a downstream patch |
| Versions, the changelog, the macOS release | yes | taken as they are |
| Building blocks: the places in shared code where the platforms differ | yes | identical |
| The Windows runtime: the shell's Windows code, tray, installer, Windows dependencies | no | yes |
| Windows texts, look and docs | no | yes, in files of their own |
| Windows build, checks and release | no | yes |

The test for a change is one question: would a Mac user notice it? Then it belongs upstream, as
an issue or a pull request. A feature that does not fit upstream's workflow goes behind a setting
whose default keeps upstream's behaviour (the `add-setting` skill). What upstream declines is not
built here on the quiet: it is dropped, or listed under "Where this repository differs" with its
reason.

A building block is a change to a file both repositories have, that changes nothing on the Mac
and can be checked there: keys are read through `modifiersOf` instead of `metaKey`, key names are
written when a text is shown, what the shell does differently per platform sits in
`src-tauri/src/platform/`. Building blocks go upstream, so that these files are the same in both
repositories and a merge has nothing to resolve in them.

## A pull request to upstream

```sh
git fetch upstream
git switch -c feat/x upstream/main              # never from this repository's main
# the change, with its tests
git switch -c try/x main && git merge feat/x    # a throwaway branch to run it on Windows
git diff --stat upstream/main...feat/x          # must show no Windows file
git push -u origin feat/x
gh pr create -R julian-wendt/inbox-for-github -B main -H andremieth:feat/x
```

Upstream's `CONTRIBUTING.md` holds for the pull request: its title, its description, its size.
Fixes after a review go to `feat/x`. In this clone `gh` defaults to this repository
(`gh repo set-default`); name the repository and the base on every `gh pr create` all the same,
since a fork's pull requests otherwise aim at upstream. An agent opens or comments on nothing
upstream without the author's explicit yes for that action.

## A change needed here before upstream has it

Open the same branch as a pull request here as well and label it `downstream-patch`. When
upstream merges its pull request, the change arrives with the next merge; where the two differ,
upstream's version wins. The open and merged pull requests with that label are the list of what
this repository carries ahead of upstream.

## Merging upstream

After each of upstream's releases, and before starting anything larger. How, and what to look at
in its changes, is in [`releasing.md`](releasing.md#merging-upstream): a pull request with a
merge commit, never a squash and never the "Sync fork" button.

## Where this repository differs

Every shared file this repository changes is a place a merge can conflict in. The number to
watch:

```sh
git diff --diff-filter=M --name-only upstream/main main | wc -l
```

It was 49 on 2026-11-13: 45 from the Windows edition, 32 of them code, and 4 from the one
downstream patch. Upstream changed 27 of those files within three days, which is what a merge
then has to resolve by hand. The building blocks are still only here; moving them upstream
brings the list down to this:

- `src-tauri/Cargo.toml` and `Cargo.lock`: the Windows dependencies, which upstream keeps out.
- `rust-toolchain.toml`: the Windows target.
- `package.json`: the script `build:local:windows`.
- `README.md`: the note at its top.
- `AGENTS.md`: the commands and the table rows for Windows and for this file.

## Public content

Both repositories are public. The rules under "Public content" in `CONTRIBUTING.md` hold for
everything that goes into either of them: code, commits, pull requests, issues and comments.
