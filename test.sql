SELECT
    coalesce(json_agg("books"), '[]') AS books
FROM
    (
        SELECT
            row_to_json(jsn_2) AS books
        FROM
            (
                SELECT
                    "base_5"."id",
                    "base_5"."title",
                    "base_5"."writer",
                    "base_5"."characters"
                FROM
                    (
                        SELECT
                            *
                        FROM
                            book AS base_0
                            LEFT JOIN LATERAL (
                                SELECT
                                    row_to_json(jsn_0) AS writer
                                FROM
                                    (
                                        SELECT
                                            "base_2"."id",
                                            "base_2"."last_name"
                                        FROM
                                            (
                                                SELECT
                                                    *
                                                FROM
                                                    writer AS base_1
                                                WHERE
                                                    true
                                                    AND "base_1"."id" = "base_0"."writer_id"
                                            ) as base_2
                                    ) AS jsn_0
                            ) AS j_0 ON true
                            LEFT JOIN LATERAL (
                                SELECT
                                    coalesce(json_agg("characters"), '[]') AS characters
                                FROM
                                    (
                                        SELECT
                                            row_to_json(jsn_1) AS characters
                                        FROM
                                            (
                                                SELECT
                                                    "base_4"."id",
                                                    "base_4"."nick_name"
                                                FROM
                                                    (
                                                        SELECT
                                                            *
                                                        FROM
                                                            character AS base_3
                                                        WHERE
                                                            true
                                                            AND "base_3"."book_id" = "base_0"."id"
                                                    ) as base_4
                                            ) AS jsn_1
                                    ) AS agg_0
                            ) AS j_1 ON true
                        WHERE
                            true
                    ) as base_5
            ) AS jsn_2
    ) AS agg_1