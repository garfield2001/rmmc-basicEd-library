export function paginationItems(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
    if (totalPages <= 4) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
        return [1, 2, 3];
    }

    if (currentPage >= totalPages - 2) {
        return ['ellipsis', ...Array.from({ length: 4 }, (_, index) => totalPages - 3 + index).filter((page) => page >= 1)];
    }

    const pages: Array<number | 'ellipsis'> = ['ellipsis'];
    const endPage = Math.min(totalPages, currentPage + 3);

    for (let page = currentPage; page <= endPage; page += 1) {
        pages.push(page);
    }

    return pages;
}
