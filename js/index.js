document.addEventListener('readystatechange', event => {
    switch (event.target.readyState) {
        case 'loading':
            break
        case 'interactive':
            break
        case 'complete':
            main()
            break
    }
})