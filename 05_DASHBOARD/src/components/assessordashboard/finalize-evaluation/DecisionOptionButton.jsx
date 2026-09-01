export default function DecisionOptionButton({
    icon: Icon,
    title,
    description,
    active,
    onClick,
    disabled = false,
}) {

    return (

        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full rounded-xl border-2 px-4 py-4 text-left transition-all duration-200

                ${active
                    ? "border-[#2563EB] bg-blue-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                }

                ${disabled
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }
            `}
        >

            <div className="flex items-start gap-3">

                {Icon && (

                    <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                            active
                                ? "bg-[#2563EB] text-white"
                                : "bg-gray-100 text-gray-500"
                        }`}
                    >

                        <Icon size={20} />

                    </div>

                )}


                <div className="flex-1">

                    <h3 className="text-xl font-semibold text-gray-900">
                        {title}
                    </h3>

                    {description && (

                        <p className="mt-1 text-lg leading-5 text-gray-500">
                            {description}
                        </p>

                    )}

                </div>

            </div>

        </button>

    );
}