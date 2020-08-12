SELECT
    coalesce(
        json_agg(
            "characters"
            ORDER BY
                "ob.nickName" ASC NULLS LAST
        ),
        '[]'
    ) AS characters
FROM
    (
        SELECT
            row_to_json(
                (
                    SELECT
                        o_2
                    FROM
                        (
                            SELECT
                                "base_2"."id" AS "id",
                                "base_2"."nick_name" AS "nickName",
                                "base_2"."book"
                        ) AS o_2
                )
            ) AS characters,
            "base_2"."nick_name" AS "ob.nickName"
        FROM
            (
                SELECT
                    *
                FROM
                    character AS "root.base_0"
                    LEFT JOIN LATERAL (
                        SELECT
                            row_to_json(
                                (
                                    SELECT
                                        o_1
                                    FROM
                                        (
                                            SELECT
                                                "base_1"."title" AS "title",
                                                "base_1"."writer"
                                        ) AS o_1
                                )
                            ) AS book
                        FROM
                            (
                                SELECT
                                    *
                                FROM
                                    book AS "root.base_1"
                                    LEFT JOIN LATERAL (
                                        SELECT
                                            row_to_json(
                                                (
                                                    SELECT
                                                        o_0
                                                    FROM
                                                        (
                                                            SELECT
                                                                "base_0"."first_name" AS "firstName",
                                                                "base_0"."last_name" AS "lastName"
                                                        ) AS o_0
                                                )
                                            ) AS writer
                                        FROM
                                            (
                                                SELECT
                                                    *
                                                FROM
                                                    writer AS "root.base_2"
                                                WHERE
                                                    true
                                                    AND "root.base_2"."id" = "root.base_1"."writer_id"
                                            ) AS base_0
                                    ) AS j_0 ON true
                                WHERE
                                    true
                                    AND "root.base_1"."id" = "root.base_0"."book_id"
                            ) AS base_1
                    ) AS j_1 ON true
                WHERE
                    true
                    AND (
                        ("root.base_0"."id" = 'c3')
                        OR ("root.base_0"."id" = 'c4')
                        OR (
                            (
                                EXISTS (
                                    SELECT
                                        1
                                    FROM
                                        "book" AS "w_0"
                                    WHERE
                                        "w_0"."id" = "root.base_0"."book_id"
                                        AND "w_0"."title" like 'And%'
                                )
                            )
                        )
                    )
                    AND (
                        EXISTS (
                            SELECT
                                1
                            FROM
                                "book" AS "w_1"
                            WHERE
                                "w_1"."id" = "root.base_0"."book_id"
                                AND (
                                    EXISTS (
                                        SELECT
                                            1
                                        FROM
                                            "writer" AS "w_2"
                                        WHERE
                                            "w_2"."id" = "w_1"."writer_id"
                                            AND "w_2"."last_name" like ch %
                                    )
                                )
                        )
                    )
            ) AS base_2
    ) AS agg_0