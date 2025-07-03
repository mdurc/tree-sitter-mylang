import XCTest
import SwiftTreeSitter
import TreeSitterMylang

final class TreeSitterMylangTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_mylang())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Mylang grammar")
    }
}
