import { CustomTable } from "../custom-table.js"
import { CustomPaging } from "custom-paging"

customElements.define("custom-table", class extends CustomTable {
    static get layout() {
        return `<style>*{line-height: 1.5em;}</style>` + super.layout
    }
})
customElements.define("custom-paging", CustomPaging)

const elems = {
    /**
     * @type {CustomTable}
     */
    get table() {
        return document.querySelector("custom-table")
    },
    /**
     * @type {CustomPaging}
     */
    get pagings() {
        return document.querySelectorAll("custom-paging")
    },
    get selected() {
        return document.querySelector("#selected")
    },
    get hover() {
        return document.querySelector("#hover")
    },
}
const state = {
    set selected(selected) {
        this._selected = selected
        elems.selected.innerText = `action on row ${selected.row}, column ${selected.column}, name ${selected.name}, rowData ${selected.rowData}, cellData ${selected.cellData}. `
        elems.table.state = {
            ...elems.table.state,
            highlightRow: elems.table.state.body.findIndex(tableRow => tableRow.rowData == selected.rowData)
        }
    },
    get selected() {
        return this._selected
    },
    set hover(hover) {
        this._hover = hover
        if (hover) {
            elems.hover.innerText = `over on row ${hover.row}, column ${hover.column}, name ${hover.name}, rowData ${hover.rowData}, cellData ${hover.cellData}.`
        } else {
            elems.hover.innerText = "left"
        }
    },
    get hover() {
        return this._hover
    },
    get hover() {
        return this._hover
    },
    set data(data) {
        this._data = data
        const head = {
            cells: data.head.map(val => new Object({ html: val }))
        }
        elems.table.state = { head }
        this.paging = { totalElements: data.body.length, activePage: 0, pageSize: 10 }
    },
    get data() {
        return this._data
    },
    /**
     * @type {CustomPaging.State}
     */
    set paging(paging) {
        this._paging = paging
        for (const elem of elems.pagings) {
            elem.state = paging
        }
        const { activePage, pageSize } = this.paging
        let start = activePage * pageSize,
            end = (activePage + 1) * pageSize
        const pageData = this.data.body.slice(start, end)
        elems.table.state = {
            ...elems.table.state,
            body: pageData.map(rowData => new Object({ rowData, cells: rowData.map(cellData => new Object({ cellData: cellData, name: cellData, html: cellData })) })),
            highlightRow: pageData.indexOf(this.selected && this.selected.rowData)
        }
    },
    get paging() {
        return this._paging
    }
}

state.table = {
    head: {
        rowData: { foo: "bar" }, cells: [
            { html: "Foo", name: "foo" },
            { html: "Bar", name: "bar" },
            { html: "Coo", name: "coo" },
            { html: "Doo", name: "doo" },
        ]
    },
}
state.data = {
    head: ["Foo", "Bar", "Coo", "Doo"],
    body: Array(1001).fill(0).map((_, index) => {
        return ["NO." + index, "a", "b", "c"]
    })
}
elems.table.addEventListener("table-action", event => {
    state.selected = event.detail
})
elems.table.addEventListener("table-over", event => {
    state.hover = event.detail
})
elems.table.addEventListener("mouseleave", event => {
    state.hover = null
})
for (const paging of elems.pagings) {
    paging.addEventListener("action", event => {
        const { page } = event.detail
        state.paging = { ...state.paging, activePage: page }
    })
}