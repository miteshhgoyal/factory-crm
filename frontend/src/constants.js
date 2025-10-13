export const CONFIG = {
    systemName: "Multi Companies Management System",
}

export const STOCK_COLORS = [
    {
        value: 'red',
        label: 'Red',
        bgClass: 'bg-red-500',
        hoverClass: 'hover:bg-red-600',
        lightBg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        darkText: 'text-red-900'
    },
    {
        value: 'pink',
        label: 'Pink',
        bgClass: 'bg-pink-500',
        hoverClass: 'hover:bg-pink-600',
        lightBg: 'bg-pink-50',
        border: 'border-pink-200',
        text: 'text-pink-700',
        darkText: 'text-pink-900'
    },
    {
        value: 'yellow',
        label: 'Yellow',
        bgClass: 'bg-yellow-500',
        hoverClass: 'hover:bg-yellow-600',
        lightBg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        darkText: 'text-yellow-900'
    },
    {
        value: 'green',
        label: 'Green',
        bgClass: 'bg-green-500',
        hoverClass: 'hover:bg-green-600',
        lightBg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        darkText: 'text-green-900'
    },
    {
        value: 'blue',
        label: 'Blue',
        bgClass: 'bg-blue-500',
        hoverClass: 'hover:bg-blue-600',
        lightBg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        darkText: 'text-blue-900'
    },
    {
        value: 'purple',
        label: 'Purple',
        bgClass: 'bg-purple-500',
        hoverClass: 'hover:bg-purple-600',
        lightBg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        darkText: 'text-purple-900'
    },
    {
        value: 'orange',
        label: 'Orange',
        bgClass: 'bg-orange-500',
        hoverClass: 'hover:bg-orange-600',
        lightBg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        darkText: 'text-orange-900'
    },
    {
        value: 'gray',
        label: 'Gray',
        bgClass: 'bg-gray-500',
        hoverClass: 'hover:bg-gray-600',
        lightBg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        darkText: 'text-gray-900'
    }
];

export const getColorConfig = (color) => {
    // Find color config from array by matching value
    const config = STOCK_COLORS.find(c => c.value === color);

    // Fallback to gray if color not found
    if (!config) {
        const grayConfig = STOCK_COLORS.find(c => c.value === 'gray');  
        return {
            label: grayConfig.label,
            bgClass: grayConfig.bgClass,
            text: grayConfig.text,
            border: grayConfig.border,
            lightBg: grayConfig.lightBg
        };
    }

    return {
        label: config.label,
        bgClass: config.bgClass,
        text: config.text,
        border: config.border,
        lightBg: config.lightBg
    };
};

export const getColorBadgeClass = (colorValue) => {
    const color = getColorConfig(colorValue);
    return `${color.lightBg} ${color.text} ${color.border}`;
};