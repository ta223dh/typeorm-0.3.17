import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import { Post } from "../../sample/sample1-simple-entity/entity/Post"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../utils/test-utils"

describe("integration", function () {
    let newPost: Post
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({entities: [Post],})
        
        if(!(connections.length >= 1)) {
            throw new Error("No database connection found to run integration tests");
        }
    })

    beforeEach(async function() {
        await reloadTestingDatabases(connections)

        newPost = new Post()
        newPost.text = "Hello post"
        newPost.title = "this is post title"
        newPost.likesCount = 0
      })

    after(() => closeTestingConnections(connections))

    it(`database connection(s) exist`, async () => {
        if (connections.length >= 1) {
            printDatabases(connections)
        }

        expect(connections.length).greaterThanOrEqual(1)
    });

    it("create: should return the same post", () =>
    Promise.all(
        connections.map(async (connection) => {
            const postRepository = connection.getRepository(Post)
            const savedPost = await postRepository.save(newPost)

            savedPost.should.be.equal(newPost, connection.name)
        }),
    ))

    it("create: should return post with an id", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const savedPost = await postRepository.save(newPost)

                expect(savedPost.id, connection.name).not.to.be.undefined
            }),
        ))

    it("read: should return content of original post", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const savedPost = await postRepository.save(newPost)
                const insertedPost = await postRepository.findOneBy({
                    id: savedPost.id,
                })
                newPost.id = savedPost.id

                insertedPost!.should.be.eql(newPost, connection.name)
            }),
        ))

    function printDatabases (connections: DataSource[]) {
        let message: string = "    Integration tests will run on:"
        connections.forEach(connection => {
            message += " " + connection.name
        });
        console.log(message)
    }
})