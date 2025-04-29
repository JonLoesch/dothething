import { HiOutlineArchiveBoxXMark, HiOutlineBars3, HiOutlineChevronDoubleRight, HiOutlineChevronRight, HiOutlineTrash, HiOutlineUser, HiOutlineXMark } from "react-icons/hi2";
import type { IconBaseProps } from "react-icons/lib";
import { MdInfoOutline } from "react-icons/md";

export const Icon = {
    Trash: HiOutlineTrash,
    XMark: HiOutlineXMark,
    Hamburger: HiOutlineBars3,
    BreadcrumbSeparator: HiOutlineChevronDoubleRight,
    Dropdown,
    EmptyMarker: HiOutlineArchiveBoxXMark, // TODO change this
    Anonymous: HiOutlineUser,
    Info: MdInfoOutline,
}

function Dropdown(props: IconBaseProps) {
    return <HiOutlineChevronRight {...props} className="transition rotate-0 data-expanded:rotate-90" />
}