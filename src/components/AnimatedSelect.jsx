import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
    open: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
    closed: { opacity: 0, scale: 0.98, transition: { duration: 0.12 } },
};

const backdropVariants = {
    visible: { opacity: 0.2 },
    hidden: { opacity: 0 },
};

export default function AnimatedSelect({ options = [], placeholder = "--Choose--", onChange = () => { }, className = "w-full" }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const ref = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        function onDoc(e) {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    useEffect(() => {
        if (open && listRef.current) {
            // focus first item for keyboard users
            const first = listRef.current.querySelector("[role=option]");
            if (first) first.focus();
        }
    }, [open]);

    function toggle() {
        setOpen((v) => !v);
    }

    function handleSelect(opt) {
        setSelected(opt);
        setOpen(false);
        onChange(opt);
    }

    function onKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    }

    return (
        <div className={`${className} relative`} ref={ref}>
            <button
                aria-haspopup="listbox"
                aria-expanded={open}
                className="w-full text-left px-4 py-2 bg-white border rounded flex items-center justify-between shadow-sm hover:shadow-md transition"
                onClick={toggle}
                onKeyDown={onKeyDown}
                type="button"
            >
                <span>{selected ? selected.label : placeholder}</span>
                <svg className={`w-4 h-4 ml-2 transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.1 1.02l-4.25 4.657a.75.75 0 01-1.1 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={backdropVariants}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/20 z-20"
                        />

                        <motion.ul
                            ref={listRef}
                            role="listbox"
                            aria-activedescendant={selected?.id}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={containerVariants}
                            className="absolute z-30 mt-2 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto p-1"
                        >
                            {options.map((opt) => (
                                <li
                                    key={opt.value}
                                    role="option"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") handleSelect(opt);
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            const next = e.currentTarget.nextElementSibling;
                                            if (next) next.focus();
                                        }
                                        if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            const prev = e.currentTarget.previousElementSibling;
                                            if (prev) prev.focus();
                                        }
                                    }}
                                    onClick={() => handleSelect(opt)}
                                    className={`px-3 py-2 rounded hover:bg-gray-100 cursor-pointer outline-none ${selected && String(selected.value) === String(opt.value) ? "bg-gray-100 font-medium" : ""}`}
                                >
                                    {opt.label}
                                </li>
                            ))}
                        </motion.ul>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
