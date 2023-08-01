import plugin from "../plugin.json";
import prettier from "prettier/standalone";
import HtmlPlugin from "prettier/parser-html";
import phpPlugin from "@prettier/plugin-php/standalone";

const appSettings = acode.require("settings");
const loader = acode.require("loader");

class PHPPrettifier {
    // default settings variable
    PHP_VERSION = "7.0";
    PRINT_WIDTH = 80;
    USE_TABS = false;
    SINGLE_QUOTE = false;
    TRAILING_COMMA_PHP = true;
    BRACE_STYLE = "per-cs";
    REQUIRE_PRAGMA = false;
    INSERT_PRAGMA = false;

    constructor() {
        if (!appSettings.value[plugin.id]) {
            appSettings.value[plugin.id] = {
                phpVersion: this.PHP_VERSION,
                printWidth: this.PRINT_WIDTH,
                tabWidth: appSettings.get("tabSize"),
                useTabs: this.USE_TABS,
                singleQuote: this.SINGLE_QUOTE,
                trailingCommaPHP: this.TRAILING_COMMA_PHP,
                braceStyle: this.BRACE_STYLE,
                requirePragma: this.REQUIRE_PRAGMA,
                insertPragma: this.INSERT_PRAGMA,
            };
            appSettings.update(false);
        }
    }

    async init() {
        acode.registerFormatter(plugin.id, ["php"], async () => {
            try {
                const { editor, activeFile } = editorManager;
                const { session } = activeFile;
                const code = editor.getValue();
                const parser = "php";
                const config = {
                    plugins: [HtmlPlugin, phpPlugin],
                    parser,
                    phpVersion: this.settings.phpVersion,
                    printWidth: this.settings.printWidth,
                    tabWidth: this.settings.tabWidth,
                    useTabs: this.settings.useTabs,
                    singleQuote: this.settings.singleQuote,
                    trailingCommaPHP: this.settings.trailingCommaPHP,
                    braceStyle: this.settings.braceStyle,
                    requirePragma: this.settings.requirePragma,
                    insertPragma: this.settings.insertPragma,
                };
                loader.showTitleLoader();
                const res = await prettier.format(code, config);
                this.setValueToEditor(session, res);
                loader.removeTitleLoader();
                window.toast("Formatted 🎉");
            } catch (error) {
                loader.removeTitleLoader();
                acode.alert("PHPPrettifier", error.message);
            }
        });
    }

    setValueToEditor(session, formattedCode) {
        const { $undoStack, $redoStack, $rev, $mark } = Object.assign(
            {},
            session.getUndoManager()
        );
        session.setValue(formattedCode);
        const undoManager = session.getUndoManager();
        undoManager.$undoStack = $undoStack;
        undoManager.$redoStack = $redoStack;
        undoManager.$rev = $rev;
        undoManager.$mark = $mark;
    }

    async destroy() {
        // removing this plugin formatter
        acode.unregisterFormatter(plugin.id);
    }

    get settingsObj() {
        return {
            list: [
                {
                    key: "phpVersion",
                    text: "PHP Version",
                    value: this.settings.phpVersion,
                    info: "Allows specifying the PHP version you're using. If you're using PHP 7.1 or later, setting this option will make use of modern language features in the printed output. If you're using PHP lower than 7.0, you'll have to set this option or Plugin will generate incompatible code.",
                    prompt: "PHP Version",
                    promptType: "text",
                    promptOption: [
                        {
                            required: true,
                        },
                    ],
                },
                {
                    key: "printWidth",
                    text: "Print Width",
                    value: this.settings.printWidth,
                    info: "Same as in Prettier (see prettier docs: https://prettier.io/docs/en/options.html#print-width)",
                    prompt: "Print Width",
                    promptType: "number",
                    promptOption: [
                        {
                            required: true,
                        },
                    ],
                },
                {
                    key: "tabWidth",
                    text: "Tab width",
                    value: this.settings.tabWidth,
                    info: "Same as in Prettier (see prettier docs: https://prettier.io/docs/en/options.html#tab-width), The default is according to your editor tab size.",
                    prompt: "Tab Width",
                    promptType: "number",
                    promptOption: [
                        {
                            required: true,
                        },
                    ],
                },
                {
                    key: "useTabs",
                    text: "Use Tabs",
                    checkbox: this.settings.useTabs,
                    info: "Same as in Prettier (see prettier docs: https://prettier.io/docs/en/options.html#tabs)",
                },
                {
                    key: "singleQuote",
                    text: "Single Quote",
                    checkbox: this.settings.singleQuote,
                    info: `If set to "true", strings that use double quotes but do not rely on the features they add, will be reformatted. Example: "foo" -> 'foo', "foo $bar" -> "foo $bar".`,
                },
                {
                    key: "trailingCommaPHP",
                    text: "Trailing Comma PHP",
                    checkbox: this.settings.trailingCommaPHP,
                    info: `If set to "true", trailing commas will be added wherever possible. If set to "false", no trailing commas are printed.`,
                },
                {
                    key: "braceStyle",
                    text: "Brace Style",
                    value: this.settings.braceStyle,
                    info: `If set to "per-cs", plugin will move open brace for code blocks (classes, functions and methods) onto new line. If set to "1tbs", plugin will move open brace for code blocks (classes, functions and methods) onto same line.`,
                    prompt: "Brace Style",
                    promptType: "text",
                    promptOption: [
                        {
                            required: true,
                        },
                    ],
                },
                {
                    key: "requirePragma",
                    text: "Require Pragma",
                    checkbox: this.settings.requirePragma,
                    info: "Same as in Prettier (see prettier docs: https://prettier.io/docs/en/options.html#require-pragma)",
                },
                {
                    key: "insertPragma",
                    text: "Insert Pragma",
                    checkbox: this.settings.insertPragma,
                    info: "Same as in Prettier (see prettier docs: https://prettier.io/docs/en/options.html#insert-pragma)",
                },
            ],
            cb: (key, value) => {
                this.settings[key] = value;
                appSettings.update();
            },
        };
    }

    get settings() {
        return appSettings.value[plugin.id];
    }
}

if (window.acode) {
    const acodePlugin = new PHPPrettifier();
    acode.setPluginInit(
        plugin.id,
        (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
            if (!baseUrl.endsWith("/")) {
                baseUrl += "/";
            }
            acodePlugin.baseUrl = baseUrl;
            acodePlugin.init($page, cacheFile, cacheFileUrl);
        },
        acodePlugin.settingsObj
    );
    acode.setPluginUnmount(plugin.id, () => {
        acodePlugin.destroy();
    });
}
