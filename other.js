export function print(text) {
    return console.log(text);
}

export function printp(text) {
    const p = document.getElementById("p");
    p.innerHTML = text;
}