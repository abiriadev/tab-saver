const download = res =>
    chrome.downloads.download({
        url: URL.createObjectURL(
            new Blob([res], {
                type: 'application/json',
            }),
        ),
        filename: 'tabs.json',
    })

const getAllTabsId = async () =>
    JSON.stringify(
        (
            await Promise.allSettled(
                (
                    await chrome.windows.getAll()
                )
                    .map(w => w.id)
                    .filter(_ => _)
                    .map(windowId => chrome.tabs.query({ windowId: windowId })),
            )
        )
            .filter(o => o.status === 'fulfilled')
            .map(ful => ful.value)
            .map(windowTabs => windowTabs.map(tab => tab.url)),
        null,
        2,
    )

document.addEventListener('DOMContentLoaded', async domEv => {
    const extractBtn = document.getElementById('extract')
    const importBtn = document.getElementById('import')
    const out = document.getElementById('out')

    extractBtn.addEventListener('click', async ev => {
        const res = await getAllTabsId()

        out.innerText = res

        download(res)
    })

    importBtn.addEventListener('change', ev => {
        const [file] = ev.target.files

        const fr = new FileReader()

        fr.onload = () => {
            out.innerText = fr.result

            Promise.allSettled(
                JSON.parse(fr.result).map(w =>
                    chrome.windows.create({
                        url: w,
                    }),
                ),
            )
        }

        fr.onerror = err => {
            console.error(err)
        }

        fr.readAsText(file)
    })
})
